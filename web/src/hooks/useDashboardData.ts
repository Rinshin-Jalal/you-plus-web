'use client';

import { useState, useEffect } from 'react';

export interface DashboardData {
  nextCallTime: Date;
  identityStatus: string;
  stats: {
    promisesKept: number;
    promisesBroken: number;
    streak: number;
    trustScore: number;
  };
  user: {
    name: string;
    identity: string;
  }
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock API Fetch
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Calculate next 9 PM
      const now = new Date();
      const nextCall = new Date();
      nextCall.setHours(21, 0, 0, 0);
      if (now.getHours() >= 21) {
        nextCall.setDate(nextCall.getDate() + 1);
      }

      setData({
        nextCallTime: nextCall,
        identityStatus: 'PATHETIC', // Hardcoded for the "Brutal" experience initially
        stats: {
          promisesKept: 12,
          promisesBroken: 4,
          streak: 0,
          trustScore: 15, // Low score to match "Pathetic"
        },
        user: {
          name: "Initiate",
          identity: "The Founder"
        }
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading };
};
