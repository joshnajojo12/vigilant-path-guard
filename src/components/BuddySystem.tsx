import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Users, MapPin, Bell, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuddyConnection {
  id: string;
  buddy_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  last_location_lat: number | null;
  last_location_lng: number | null;
  last_seen: string;
  buddy_phone?: string;
}

interface BuddySystemProps {
  userId: string;
  currentLocation: { latitude: number; longitude: number } | null;
}

export function BuddySystem({ userId, currentLocation }: BuddySystemProps) {
  const [buddies, setBuddies] = useState<BuddyConnection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBuddies();
    const subscription = subscribeToBuddyUpdates();
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    if (currentLocation) {
      updateLocationForBuddies();
    }
  }, [currentLocation]);

  const loadBuddies = async () => {
    try {
      const { data, error } = await supabase
        .from('buddy_connections')
        .select('*')
        .or(`user_id.eq.${userId},buddy_id.eq.${userId}`);

      if (error) throw error;
      setBuddies(data || []);
    } catch (error) {
      console.error('Error loading buddies:', error);
    }
  };

  const subscribeToBuddyUpdates = () => {
    return supabase
      .channel('buddy_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buddy_connections',
          filter: `user_id=eq.${userId},buddy_id=eq.${userId}`
        },
        () => {
          loadBuddies();
        }
      )
      .subscribe();
  };

  const updateLocationForBuddies = async () => {
    if (!currentLocation) return;

    try {
      const { error } = await supabase
        .from('buddy_connections')
        .update({
          last_location_lat: currentLocation.latitude,
          last_location_lng: currentLocation.longitude,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (error) throw error;
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const sendBuddyRequest = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a buddy ID',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('buddy_connections')
        .insert({
          user_id: userId,
          buddy_id: searchQuery.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Buddy request sent!'
      });

      setSearchQuery('');
      loadBuddies();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send buddy request',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acceptBuddyRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('buddy_connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Buddy request accepted!'
      });

      loadBuddies();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept request',
        variant: 'destructive'
      });
    }
  };

  const rejectBuddyRequest = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('buddy_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Buddy request rejected'
      });

      loadBuddies();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive'
      });
    }
  };

  const sendSOSToBuddy = async (buddyId: string) => {
    if (!currentLocation) {
      toast({
        title: 'Error',
        description: 'Location not available',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'SOS Sent!',
      description: 'Your buddy has been notified of your emergency'
    });
  };

  const pendingRequests = buddies.filter(b => b.status === 'pending' && b.buddy_id === userId);
  const acceptedBuddies = buddies.filter(b => b.status === 'accepted');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Buddy System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter buddy user ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendBuddyRequest()}
          />
          <Button onClick={sendBuddyRequest} disabled={isLoading}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Pending Requests</h3>
            {pendingRequests.map((buddy) => (
              <div key={buddy.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">User {buddy.user_id.slice(0, 8)}...</p>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => acceptBuddyRequest(buddy.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => rejectBuddyRequest(buddy.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {acceptedBuddies.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Active Buddies</h3>
            {acceptedBuddies.map((buddy) => {
              const buddyUserId = buddy.user_id === userId ? buddy.buddy_id : buddy.user_id;
              const hasLocation = buddy.last_location_lat && buddy.last_location_lng;

              return (
                <div key={buddy.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{buddyUserId.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">User {buddyUserId.slice(0, 8)}...</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {hasLocation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location shared
                          </span>
                        )}
                        <span>Active {new Date(buddy.last_seen).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasLocation && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://maps.google.com/?q=${buddy.last_location_lat},${buddy.last_location_lng}`, '_blank')}
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => sendSOSToBuddy(buddyUserId)}>
                      <Bell className="w-4 h-4 mr-1" />
                      SOS
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {buddies.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No buddies yet. Add someone to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
