import React, { useState } from 'react';
import { BarChart2, X, Plus, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const CreatePollModal = ({ show, onClose, onCreate, t }) => {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [multipleChoice, setMultipleChoice] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!show) return null;

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length >= 10) {
            Swal.fire('Limit Reached', 'You can only add up to 10 options.', 'warning');
            return;
        }
        setOptions([...options, ""]);
    };

    const removeOption = (index) => {
        if (options.length <= 2) {
            Swal.fire('Minimum Required', 'A poll must have at least 2 options.', 'warning');
            return;
        }
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) {
            Swal.fire('Required', 'Please enter a question.', 'warning');
            return;
        }
        
        const validOptions = options.filter(opt => opt.trim() !== "");
        if (validOptions.length < 2) {
            Swal.fire('Required', 'Please enter at least 2 valid options.', 'warning');
            return;
        }

        setIsSubmitting(true);
        await onCreate({ question, options: validOptions, multipleChoice });
        setIsSubmitting(false);
        onClose();
        setQuestion("");
        setOptions(["", ""]);
        setMultipleChoice(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-surface text-text-primary w-full max-w-sm rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-border flex justify-between items-center bg-[#008069] text-white">
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        <h2 className="font-bold text-lg">Create Poll</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-text-primary mb-1">Question</label>
                        <input 
                            type="text" 
                            value={question} 
                            onChange={(e) => setQuestion(e.target.value)} 
                            placeholder="Ask a question..."
                            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#008069] text-sm transition"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-text-primary mb-1">Options</label>
                        {options.map((opt, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={opt} 
                                    onChange={(e) => handleOptionChange(index, e.target.value)} 
                                    placeholder={`Option ${index + 1}`}
                                    className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#008069] text-sm transition"
                                />
                                <button type="button" onClick={() => removeOption(index)} className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {options.length < 10 && (
                        <button type="button" onClick={addOption} className="mt-3 flex items-center gap-2 text-sm text-[#008069] font-semibold hover:bg-green-50 p-2 rounded-lg transition w-full">
                            <Plus className="w-4 h-4" /> Add Option
                        </button>
                    )}

                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">Allow multiple answers</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={multipleChoice} onChange={(e) => setMultipleChoice(e.target.checked)} />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#008069]"></div>
                        </label>
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-background flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-text-primary hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-[#008069] hover:bg-[#006a57] text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-70 transition flex items-center gap-2">
                        {isSubmitting ? "Creating..." : "Send Poll"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePollModal;
