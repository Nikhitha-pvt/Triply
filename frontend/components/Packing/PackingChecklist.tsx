import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Briefcase, Plus, Trash2 } from 'lucide-react';

interface PackingChecklistProps {
  items: any[];
}

export default function PackingChecklist({ items }: PackingChecklistProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newItemText, setNewItemText] = useState<Record<number, string>>({});

  useEffect(() => {
    if (items) {
      // Map standard checklist format to include local checked flag
      const mapped = items.map(cat => ({
        ...cat,
        items: cat.items.map((i: any) => ({
          ...i,
          checked: i.checked ?? false
        }))
      }));
      setCategories(mapped);
    }
  }, [items]);

  const toggleCheck = (catIdx: number, itemIdx: number) => {
    setCategories(prev => {
      const updated = [...prev];
      const categoryItems = [...updated[catIdx].items];
      categoryItems[itemIdx] = {
        ...categoryItems[itemIdx],
        checked: !categoryItems[itemIdx].checked
      };
      updated[catIdx].items = categoryItems;
      return updated;
    });
  };

  const addItem = (catIdx: number) => {
    const text = newItemText[catIdx]?.trim();
    if (!text) return;

    setCategories(prev => {
      const updated = [...prev];
      updated[catIdx].items = [
        ...updated[catIdx].items,
        { name: text, checked: false, is_custom: true }
      ];
      return updated;
    });

    setNewItemText(prev => ({ ...prev, [catIdx]: '' }));
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    setCategories(prev => {
      const updated = [...prev];
      const categoryItems = [...updated[catIdx].items];
      categoryItems.splice(itemIdx, 1);
      updated[catIdx].items = categoryItems;
      return updated;
    });
  };

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const packedCount = categories.reduce((acc, cat) => acc + cat.items.filter((i: any) => i.checked).length, 0);
  const progress = totalItems > 0 ? (packedCount / totalItems) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white border border-slate-200 rounded-card p-6 shadow-sm">
        <h3 className="text-sm font-bold text-darkNavy uppercase tracking-wider mb-4 flex items-center gap-2">
          <Briefcase size={16} className="text-primary" /> Smart Packing List
        </h3>
        
        <div className="mb-6 space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Progress</span>
            <span className="text-primary">{packedCount} of {totalItems} packed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
            <div 
              className="h-2 rounded-full transition-all duration-300 bg-primary"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-8">
          {categories.map((category: any, catIdx: number) => (
            <div key={catIdx} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
              <h4 className="text-xs font-bold text-slate-400 uppercase pb-2 mb-3">
                {category.category}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {category.items.map((item: any, itemIdx: number) => {
                  const isChecked = item.checked;
                  return (
                    <div 
                      key={itemIdx} 
                      className={`flex items-center gap-3 p-3 rounded-btn border cursor-pointer transition-colors group ${
                        isChecked 
                          ? 'bg-primary/5 border-primary/20 text-slate-500 line-through' 
                          : 'bg-white border-slate-200 text-darkNavy hover:border-primary/50'
                      }`}
                      onClick={() => toggleCheck(catIdx, itemIdx)}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} className="text-primary flex-shrink-0" />
                      ) : (
                        <Square size={16} className="text-slate-300 flex-shrink-0" />
                      )}
                      
                      <span className="text-sm font-semibold truncate flex-1">{item.name}</span>
                      
                      {item.is_custom && (
                        <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase mr-1 flex-shrink-0">
                          Custom
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(catIdx, itemIdx);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition sm:opacity-0 group-hover:opacity-100"
                        title="Remove Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Item Input bar */}
              <div className="flex gap-2 max-w-sm mt-3">
                <input
                  type="text"
                  placeholder={`Add item to ${category.category}...`}
                  value={newItemText[catIdx] || ''}
                  onChange={(e) => setNewItemText(prev => ({ ...prev, [catIdx]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem(catIdx);
                    }
                  }}
                  className="flex-1 border border-slate-300 rounded-btn px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addItem(catIdx)}
                  className="bg-primary hover:bg-primary-dark text-white rounded-btn px-3 py-1.5 text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
