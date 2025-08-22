'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  Share2, 
  Copy, 
  Users, 
  Check,
  Clock,
  Award,
  Gift,
  ArrowLeft
} from 'lucide-react';
import { 
  createOrGetReferralCode, 
  generateReferralLink, 
  getReferralStats, 
  getReferralHistory,
  type ReferralCode,
  type ReferralStats,
  type Referral
} from '@/lib/referralUtils';
import ResponsiveWrapper from '@/components/ResponsiveWrapper';
import ReferralsMobile from './mobile/page';
import LoadingDots from '@/components/LoadingDots';

export default function ReferralsPage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralHistory, setReferralHistory] = useState<Referral[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    if (loading) return;
    
    if (!user || !userRole) {
      router.push('/signin');
      return;
    }

    loadReferralData();
  }, [user, userRole, loading, router, loadReferralData]);

  const loadReferralData = useCallback(async () => {
    if (!user || !userRole) return;

    try {
      setLoadingData(true);
      
      // For customers, we need to get their business association
      let businessId = '';
      let businessName = '';
      
      if (userRole.role === 'Customer') {
        // Check if customer has business association
        if (userRole.businessAssociation) {
          businessId = userRole.businessAssociation.businessId;
          businessName = userRole.businessAssociation.businessReferenceCode;
        } else {
          console.warn('Customer has no business association for referrals');
          setLoadingData(false);
          return;
        }
      } else if (userRole.role === 'Business') {
        // For business users, use their own business info
        businessId = userRole.businessId || '';
        businessName = userRole.businessName || '';
      }
      
      // Load referral code
      const code = await createOrGetReferralCode(
        user.uid,
        user.email || '',
        user.displayName || 'User',
        businessId,
        businessName
      );
      setReferralCode(code);

      // Load referral stats
      const stats = await getReferralStats(user.uid);
      setReferralStats(stats);

      // Load referral history
      const history = await getReferralHistory(user.uid);
      setReferralHistory(history);

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoadingData(false);
    }
  }, [user, userRole]);

  const handleCopyLink = async () => {
    if (!referralCode) return;

    try {
      const referralLink = generateReferralLink(referralCode.referralCode);
      await navigator.clipboard.writeText(referralLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleShare = async () => {
    if (!referralCode) return;

    try {
      const referralLink = generateReferralLink(referralCode.referralCode);
      const shareText = `Join CADeala using my referral link and get exclusive benefits! 🎁\n\n${referralLink}`;

      if (navigator.share) {
        await navigator.share({
          title: 'Join CADeala',
          text: shareText,
          url: referralLink
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } else {
        // Fallback to copying
        await navigator.clipboard.writeText(shareText);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || loadingData) {
    return (
      <ResponsiveWrapper mobileComponent={<ReferralsMobile />}>
        <div className="min-h-screen bg-gray-50">
          <Sidebar type={userRole?.role === 'Business' ? 'business' : 'customer'} currentPage="referrals" />
          <main className="relative lg:ml-64">
            <div className="pt-20 lg:pt-6 lg:pl-64">
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center h-64">
                  <LoadingDots size="lg" color="text-orange" className="mb-4" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </ResponsiveWrapper>
    );
  }

  return (
    <ResponsiveWrapper mobileComponent={<ReferralsMobile />}>
      <div className="min-h-screen bg-gray-50">
        <Sidebar type={userRole?.role === 'Business' ? 'business' : 'customer'} currentPage="referrals" />
        <main className="relative lg:ml-64">
          <div className="pt-20 lg:pt-6 lg:pl-64">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-4 mb-4">
                  <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Referrals</h1>
                    <p className="text-gray-600 mt-1">Track your successful referrals and earn rewards</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Quick Actions */}
                {referralCode && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Your Referral Link</h2>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center space-x-2 px-4 py-2 bg-navy-blue text-white rounded-lg hover:bg-navy-blue-600 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        <span className="text-sm font-medium">Copy Link</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Share</span>
                      </button>
                    </div>
                    
                    {/* Success Messages */}
                    {copySuccess && (
                      <div className="mt-3 flex items-center justify-center space-x-2 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Link copied to clipboard!</span>
                      </div>
                    )}
                    {shareSuccess && (
                      <div className="mt-3 flex items-center justify-center space-x-2 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Shared successfully!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Statistics */}
                {referralStats && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Performance</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-500/10 rounded-full p-2">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">{referralStats.totalReferrals}</p>
                            <p className="text-sm text-gray-600">Total Referrals</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-500/10 rounded-full p-2">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">{referralStats.successfulReferrals}</p>
                            <p className="text-sm text-gray-600">Successful</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-yellow-500/10 rounded-full p-2">
                            <Clock className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-yellow-600">{referralStats.pendingReferrals}</p>
                            <p className="text-sm text-gray-600">Pending</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-500/10 rounded-full p-2">
                            <Award className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">{referralStats.totalPoints}</p>
                            <p className="text-sm text-gray-600">Total Points</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Referral History */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h2>
                  {referralHistory.length > 0 ? (
                    <div className="space-y-3">
                      {referralHistory.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`rounded-full p-2 ${
                              referral.status === 'completed' 
                                ? 'bg-green-100' 
                                : referral.status === 'pending'
                                ? 'bg-yellow-100'
                                : 'bg-red-100'
                            }`}>
                              {referral.status === 'completed' ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : referral.status === 'pending' ? (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              ) : (
                                <Users className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{referral.referredUserEmail}</p>
                              <p className="text-sm text-gray-600">
                                {referral.businessName} • {formatDate(referral.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              referral.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : referral.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {referral.status === 'completed' ? 'Completed' : 
                               referral.status === 'pending' ? 'Pending' : 'Failed'}
                            </span>
                            {referral.status === 'completed' && (
                              <div className="flex items-center space-x-1 text-green-600">
                                <Gift className="h-4 w-4" />
                                <span className="text-sm font-medium">Reward Earned</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals yet</h3>
                      <p className="text-gray-600">Start sharing your referral link to see your successful referrals here!</p>
                    </div>
                  )}
                </div>

                {/* How It Works */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">How Referrals Work</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="bg-orange/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                        <span className="text-orange font-bold text-lg">1</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Share Your Link</h3>
                      <p className="text-sm text-gray-600">Send your unique referral link to friends via WhatsApp, email, or any app</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-orange/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                        <span className="text-orange font-bold text-lg">2</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Friends Join</h3>
                      <p className="text-sm text-gray-600">When they sign up using your link, they automatically get the &quot;Referral&quot; rank</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-orange/10 rounded-full p-3 w-12 h-12 flex items-center justify-center mx-auto mb-3">
                        <span className="text-orange font-bold text-lg">3</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">Earn Rewards</h3>
                      <p className="text-sm text-gray-600">You earn points and benefits for each successful referral</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ResponsiveWrapper>
  );
}
