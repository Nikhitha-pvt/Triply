import io
import logging
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

logger = logging.getLogger(__name__)

def generate_itinerary_pdf(itinerary_dict: dict) -> io.BytesIO:
    """
    Generates a beautifully structured PDF document of the itinerary using ReportLab.
    """
    logger.info("Generating itinerary PDF...")
    buffer = io.BytesIO()
    
    # 1. Document Setup
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    primary_color = colors.HexColor("#1D4ED8")   # Primary Blue
    secondary_color = colors.HexColor("#0F2044") # Dark Navy
    accent_color = colors.HexColor("#0D9488")    # Teal Accent
    bg_light = colors.HexColor("#F8FAFC")
    
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=primary_color,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=secondary_color,
        spaceAfter=30
    )
    
    heading1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=secondary_color,
        spaceBefore=15,
        spaceAfter=10,
        keepWithNext=True
    )
    
    heading2_style = ParagraphStyle(
        'DayHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'StandardBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155")
    )
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=secondary_color
    )
    
    story = []
    
    # --- PAGE 1: COVER ---
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph("TRIPLY AI ITINERARY", title_style))
    
    origin = itinerary_dict["trip_request"]["origin"]
    dest = itinerary_dict["trip_request"]["destination"]
    start = itinerary_dict["trip_request"]["start_date"]
    end = itinerary_dict["trip_request"]["end_date"]
    story.append(Paragraph(f"Your custom curated travel plan from {origin} to {dest}", subtitle_style))
    story.append(Paragraph(f"Dates: {start} to {end}", body_style))
    
    # Metadata Box
    adults = itinerary_dict["trip_request"]["adults"]
    kids = itinerary_dict["trip_request"]["children"]
    infants = itinerary_dict["trip_request"]["infants"]
    budget = itinerary_dict["budget_breakdown"]["total_cost"]
    
    meta_data = [
        [Paragraph("Travellers:", meta_label_style), Paragraph(f"{adults} Adults, {kids} Children, {infants} Infants", body_style)],
        [Paragraph("Total Budget:", meta_label_style), Paragraph(f"INR {budget:,.2f}", body_style)],
        [Paragraph("Trip Purpose:", meta_label_style), Paragraph(str(itinerary_dict["trip_request"]["trip_purpose"]), body_style)],
        [Paragraph("Accommodation:", meta_label_style), Paragraph(str(itinerary_dict["trip_request"]["accommodation_type"]), body_style)],
        [Paragraph("Diet Preference:", meta_label_style), Paragraph(str(itinerary_dict["trip_request"]["diet_type"]), body_style)],
    ]
    
    meta_table = Table(meta_data, colWidths=[1.5*inch, 4.5*inch])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#F1F5F9")),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    story.append(Spacer(1, 20))
    story.append(meta_table)
    story.append(PageBreak())
    
    # --- PAGE 2: DAY BY DAY PLAN ---
    story.append(Paragraph("Day-by-Day Itinerary", heading1_style))
    
    for day in itinerary_dict.get("days", []):
        day_num = day.get("day_number", 1)
        day_date = day.get("date", "")
        story.append(Paragraph(f"Day {day_num} — {day_date}", heading2_style))
        
        # Sights/Activities
        for act in day.get("activities", []):
            time = act.get("time", "")
            loc = act.get("location", "")
            desc = act.get("description", "")
            cost = act.get("cost", 0.0)
            
            act_text = f"<b>{time}</b>: {loc}<br/>{desc}"
            if cost > 0:
                act_text += f" (Est. entry cost: INR {cost})"
                
            story.append(Paragraph(act_text, body_style))
            story.append(Spacer(1, 6))
            
        # Meals
        meals = day.get("meals", {})
        if meals:
            meal_text = "<b>Meal Plan:</b><br/>"
            b = meals.get("breakfast", {})
            l = meals.get("lunch", {})
            d = meals.get("dinner", {})
            
            if b:
                meal_text += f"• <i>Breakfast:</i> {b.get('restaurant_name')} ({b.get('cuisine')})<br/>"
            if l:
                meal_text += f"• <i>Lunch:</i> {l.get('restaurant_name')} ({l.get('cuisine')})<br/>"
            if d:
                meal_text += f"• <i>Dinner:</i> {d.get('restaurant_name')} ({d.get('cuisine')})<br/>"
                
            story.append(Paragraph(meal_text, body_style))
            story.append(Spacer(1, 10))
            
        story.append(Spacer(1, 10))
        
    story.append(PageBreak())
    
    # --- PAGE 3: BUDGET & PACKING ---
    story.append(Paragraph("Budget Summary", heading1_style))
    
    budget_breakdown = itinerary_dict.get("budget_breakdown", {})
    budget_data = [
        [Paragraph("Category", meta_label_style), Paragraph("Cost (INR)", meta_label_style)],
        [Paragraph("Transport", body_style), Paragraph(f"₹{budget_breakdown.get('transport_cost', 0):,.2f}", body_style)],
        [Paragraph("Accommodation", body_style), Paragraph(f"₹{budget_breakdown.get('accommodation_cost', 0):,.2f}", body_style)],
        [Paragraph("Food & Meals", body_style), Paragraph(f"₹{budget_breakdown.get('food_cost', 0):,.2f}", body_style)],
        [Paragraph("Activities & Entry Sights", body_style), Paragraph(f"₹{budget_breakdown.get('activities_cost', 0):,.2f}", body_style)],
        [Paragraph("Buffer (10% Contingency)", body_style), Paragraph(f"₹{budget_breakdown.get('buffer_cost', 0):,.2f}", body_style)],
        [Paragraph("Total Estimated Cost", meta_label_style), Paragraph(f"₹{budget_breakdown.get('total_cost', 0):,.2f}", meta_label_style)],
    ]
    
    budget_table = Table(budget_data, colWidths=[3.0*inch, 3.0*inch])
    budget_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#E2E8F0")),
    ]))
    story.append(budget_table)
    story.append(Spacer(1, 20))
    
    # Packing List
    story.append(Paragraph("Packing Checklist Suggestions", heading1_style))
    for cat in itinerary_dict.get("packing_list", []):
        cat_name = cat.get("category", "General")
        story.append(Paragraph(cat_name, heading2_style))
        
        items_txt = []
        for item in cat.get("items", []):
            items_txt.append(f"[  ] {item.get('name')}")
            
        story.append(Paragraph("<br/>".join(items_txt), body_style))
        story.append(Spacer(1, 10))
        
    # Build Document
    doc.build(story)
    buffer.seek(0)
    return buffer
