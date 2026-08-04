import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Send, CreditCard } from 'lucide-react';

interface PaystackProps {
    email: string;
    amount: number;
    currency: string;
    onSuccess: () => void;
    onClose?: () => void;
    label?: string;
    disabled?: boolean;
}

export const PaystackButtonWrapper: React.FC<PaystackProps> = ({ email, amount, currency, onSuccess, onClose, label = "Pay Now", disabled = false }) => {
    // Replace with a valid public key from env or a test key for MVP
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_dummypublickey1234567890";
    
    // Paystack amounts are in kobo for NGN, pesewas for GHS, etc. So multiply by 100.
    const config = {
        reference: (new Date()).getTime().toString(),
        email: email,
        amount: amount * 100, 
        currency: currency,
        publicKey: publicKey,
    };

    const initializePayment = usePaystackPayment(config);

    const handlePayment = () => {
        initializePayment({
            onSuccess: () => {
                onSuccess();
            },
            onClose: () => {
                if (onClose) onClose();
            }
        });
    };

    return (
        <button 
            onClick={handlePayment}
            disabled={disabled}
            className="w-full justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition flex items-center"
        >
            <CreditCard className="w-4 h-4 mr-2" /> {label}
        </button>
    );
};
