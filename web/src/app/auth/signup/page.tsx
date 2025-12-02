'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SignupPage() {
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    const errorParam = searchParams.get('error');
    const emailParam = searchParams.get('email');

    useEffect(() => {
        if (errorParam === 'not_registered') {
            setError(`Account not found. Please contact support to register.`);
        }
    }, [errorParam]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-md p-8 space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registration Required</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {emailParam ? `Account ${emailParam} is not registered` : 'Account not found'}
                    </p>
                </div>

                {error && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <p className="text-center text-gray-600 dark:text-gray-400">
                        This is a sign-in only application. Please contact the administrator to get access.
                    </p>

                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="w-full"
                        variant="primary"
                    >
                        Back to Login
                    </Button>
                </div>
            </Card>
        </div>
    );
}
