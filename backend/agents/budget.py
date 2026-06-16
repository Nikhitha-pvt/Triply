import logging
from typing import List, Optional
from backend.models.trip_request import TripRequest
from backend.models.itinerary import BudgetBreakdown, GroupSplit, PersonShare, SettlementTransaction

logger = logging.getLogger(__name__)

def calculate_budget(
    trip_req: TripRequest,
    transport_cost: float,
    accommodation_cost: float,
    food_cost: float,
    activities_cost: float
) -> BudgetBreakdown:
    """
    Budget Coordinator: Sums all costs, adds a 10% buffer, and checks against target budget.
    """
    logger.info("Calculating budget breakdown...")
    
    # 10% buffer cost
    subtotal = transport_cost + accommodation_cost + food_cost + activities_cost
    buffer_cost = round(subtotal * 0.1, 2)
    total_cost = round(subtotal + buffer_cost, 2)
    
    overspent = total_cost > trip_req.budget_inr
    
    return BudgetBreakdown(
        transport_cost=round(transport_cost, 2),
        accommodation_cost=round(accommodation_cost, 2),
        food_cost=round(food_cost, 2),
        activities_cost=round(activities_cost, 2),
        buffer_cost=buffer_cost,
        total_cost=total_cost,
        overspent=overspent
    )

def calculate_group_split(
    trip_req: TripRequest,
    budget: BudgetBreakdown
) -> Optional[GroupSplit]:
    """
    Computes per-person shares and solves the debt settlement optimization problem.
    Uses a greedy graph settlement algorithm to minimize the number of transactions.
    """
    if trip_req.adults <= 1:
        return None
        
    names = [name.strip() for name in (trip_req.traveller_names or []) if name and name.strip()]
    # Fill in names if missing
    while len(names) < trip_req.adults:
        names.append(f"Traveller {len(names) + 1}")
        
    total_cost = budget.total_cost
    num_people = len(names)
    
    # Calculate share per person
    shares = []
    split_type = trip_req.split_type or "equal"
    
    if split_type == "equal":
        share_amount = round(total_cost / num_people, 2)
        shares = [PersonShare(name=n, amount_owed=share_amount) for n in names]
    else:
        # Custom split: Assume equal for now if details are missing, or mock percentages
        # Custom split parsing can be extended if user inputs custom values in frontend
        # For simulation, let's assign slightly custom splits
        import random
        # Ensure percentages sum to 100
        pcts = [100.0 / num_people] * num_people
        if num_people >= 2:
            pcts[0] += 5.0
            pcts[1] -= 5.0
        shares = [
            PersonShare(name=names[idx], amount_owed=round(total_cost * (pcts[idx] / 100.0), 2))
            for idx in range(num_people)
        ]
        
    # Debt settlement logic (Greedy Algorithm)
    # 1. Calculate net balance for each person.
    # In a simplified real-world scenario, let's say Traveller 1 (the Group Lead) paid for everything,
    # so they spent 'total_cost'. Everyone else spent 0.0.
    # Net balance = Amount Spent - Amount Owed
    # Lead: total_cost - Lead_Owed = positive (creditor)
    # Others: 0 - Other_Owed = negative (debtors)
    balances = {}
    for idx, share in enumerate(shares):
        if idx == 0: # Group Lead paid the whole bill
            balances[share.name] = total_cost - share.amount_owed
        else:
            balances[share.name] = 0.0 - share.amount_owed
            
    # 2. Match debtors with creditors
    settlements = []
    
    # Keep running until balances are settled (close to 0)
    debtors = sorted([(k, v) for k, v in balances.items() if v < -0.01], key=lambda x: x[1])
    creditors = sorted([(k, v) for k, v in balances.items() if v > 0.01], key=lambda x: x[1], reverse=True)
    
    while debtors and creditors:
        debtor_name, debtor_bal = debtors[0]
        creditor_name, creditor_bal = creditors[0]
        
        # Settle amount
        settle_amt = min(abs(debtor_bal), creditor_bal)
        settle_amt = round(settle_amt, 2)
        
        settlements.append(SettlementTransaction(
            debtor=debtor_name,
            creditor=creditor_name,
            amount=settle_amt
        ))
        
        # Update balances
        new_debtor_bal = round(debtor_bal + settle_amt, 2)
        new_creditor_bal = round(creditor_bal - settle_amt, 2)
        
        # Remove or update lists
        if abs(new_debtor_bal) < 0.01:
            debtors.pop(0)
        else:
            debtors[0] = (debtor_name, new_debtor_bal)
            
        if abs(new_creditor_bal) < 0.01:
            creditors.pop(0)
        else:
            creditors[0] = (creditor_name, new_creditor_bal)
            
    return GroupSplit(
        shares=shares,
        settlement_transactions=settlements
    )
