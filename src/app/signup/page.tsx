'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { validateSignupLink, CustomerRank } from '@/lib/customerRankUtils';
import { CheckCircle, AlertCircle } from 'lucide-react';

function SignUpPageContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [businessRank, setBusinessRank] = useState<CustomerRank | null>(null);
  const [validatingLink, setValidatingLink] = useState(true);
  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validate business and rank from URL parameters
  useEffect(() => {
    const validateBusinessLink = async () => {
      const business = searchParams.get('business');
      const rank = searchParams.get('rank');

      if (business && rank) {
        try {
          setValidatingLink(true);
          const rankData = await validateSignupLink(business, rank);
          if (rankData) {
            setBusinessRank(rankData);
          } else {
            setError('Invalid or expired signup link. Please contact the business for a valid link.');
          }
        } catch (error) {
          console.error('Error validating signup link:', error);
          setError('Error validating signup link. Please try again or contact support.');
        } finally {
          setValidatingLink(false);
        }
      } else {
        setValidatingLink(false);
      }
    };

    validateBusinessLink();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // If there's a business rank, we need to create the user with business association
      if (businessRank) {
        await signUp(email, password, name, phone || undefined, {
          businessId: businessRank.businessId,
          businessReferenceCode: businessRank.businessReferenceCode,
          rankId: businessRank.id!,
          rankName: businessRank.name
        });
      } else {
        await signUp(email, password, name, phone || undefined);
      }
      
      router.push('/dashboard');
    } catch (error: unknown) {
      // Check if it's a network blocking error
      if (error instanceof Error && error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.warn('Network request was blocked, but account creation may have succeeded');
        // Try to redirect to dashboard anyway since the account might have been created
        router.push('/dashboard');
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-navy-blue rounded-lg flex items-center justify-center">
            <img
              src="/CADEALA LOGO.png"
              alt="CADeala Logo"
              className="h-8 w-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join CADeala and start using gift cards
          </p>
        </div>

        {/* Business Rank Information */}
        {validatingLink && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 text-sm">Validating signup link...</span>
            </div>
          </div>
        )}

        {businessRank && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Business Signup Link Validated
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  You&apos;re signing up for: <span className="font-semibold">{businessRank.name}</span>
                </p>
                {businessRank.description && (
                  <p className="text-sm text-green-700 mt-1">
                    {businessRank.description}
                  </p>
                )}
                {businessRank.benefits && (
                  <p className="text-sm text-green-700 mt-1">
                    <span className="font-medium">Benefits:</span> {businessRank.benefits}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && !validatingLink && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Signup Link Error
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Disable form if there's an error with business link */}
          {(error && !validatingLink) && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 z-10 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <p className="text-gray-600 text-sm">Please fix the signup link error to continue</p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone number (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || (!!error && !validatingLink)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange hover:bg-orange/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/signin" className="font-medium text-orange hover:text-orange/80">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpPageContent />
    </Suspense>
  );
}
