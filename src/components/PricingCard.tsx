import React, { useState } from 'react';
import { Check, Loader2, Star } from 'lucide-react';
import { StripeProduct } from '../stripe-config';

interface PricingCardProps {
  product: StripeProduct;
  isPopular?: boolean;
  onSubscribe: (priceId: string) => Promise<void>;
  disabled?: boolean;
  currentPlan?: string;
}

export function PricingCard({
  product,
  isPopular = false,
  onSubscribe,
  disabled = false,
  currentPlan
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onSubscribe(product.priceId);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const planType = product.name.split(' – ')[1]?.toLowerCase();
  const isCurrentPlan = currentPlan === planType;

  const features = [
    `${product.description.split('.')[0]}`,
    'PDF export',
    ...(planType === 'standard' || planType === 'pro' ? ['DOCX export'] : []),
    ...(planType === 'pro' ? ['TXT export', 'Priority support'] : []),
    'Cancel anytime'
  ];

  return (
    <div className={`relative bg-white rounded-2xl flex flex-col h-full transition-all duration-300 ${
      isPopular
        ? 'border-2 border-[#4CAF50] shadow-xl hover:shadow-2xl'
        : 'border border-gray-200 shadow-md hover:shadow-xl'
    } hover:-translate-y-1`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-[#4CAF50] text-white px-4 sm:px-5 py-2 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
            <Star size={14} fill="currentColor" />
            <span>Most Popular</span>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8 lg:p-10 flex flex-col flex-grow">
        <div className="text-center mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 tracking-tight">
            {product.name.split(' – ')[1]}
          </h3>
          <div className="flex items-baseline justify-center mb-2">
            <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              {product.currencySymbol}{product.price}
            </span>
            <span className="text-gray-500 ml-2 text-sm font-medium">/month</span>
          </div>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{product.description}</p>
        </div>

        <ul className="space-y-3.5 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Check size={20} className="text-[#4CAF50]" strokeWidth={2.5} />
              </div>
              <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={disabled || isLoading || isCurrentPlan}
          className={`relative block w-full py-3.5 px-6 rounded-lg font-semibold text-base transition-all duration-200 text-center overflow-hidden ${
            isCurrentPlan
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : isLoading
              ? 'cursor-wait opacity-75'
              : isPopular
              ? 'bg-[#4CAF50] hover:bg-[#45a049] text-white shadow-sm hover:shadow-md active:scale-98'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900 shadow-sm hover:shadow active:scale-98'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>Processing...</span>
            </span>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            'Choose Plan'
          )}
        </button>
      </div>
    </div>
  );
}