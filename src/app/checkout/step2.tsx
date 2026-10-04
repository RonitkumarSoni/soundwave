import React from 'react';
import { UnavailableFeature } from '@/components/UnavailableFeature';
import { BILLING_NOTICE } from '@/lib/billing';
export default function CheckoutStep2() { return <UnavailableFeature title="Checkout unavailable" message={BILLING_NOTICE} />; }
