import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ 
    title, 
    description, 
    icon: Icon = PackageOpen, 
    actionText, 
    onAction 
}) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-surface rounded-2xl border border-dashed border-border shadow-sm">
            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
            <p className="text-text-secondary max-w-sm mb-6 leading-relaxed">
                {description}
            </p>
            {actionText && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionText}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
