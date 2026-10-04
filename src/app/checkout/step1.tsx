import React from 'react';
import { UnavailableFeature } from '@/components/UnavailableFeature';
import { BILLING_NOTICE } from '@/lib/billing';
export default function CheckoutStep1() { return <UnavailableFeature title="Checkout unavailable" message={BILLING_NOTICE} />; }
