import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { EmergencyDashboard } from '@/components/EmergencyDashboard';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function SafetyApp() {
  const [userId, setUserId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [secretCode, setSecretCode] = useState('Amma');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      // Get or create user ID from localStorage
      let uid = localStorage.getItem('safety_user_id');
      
      if (!uid) {
        uid = crypto.randomUUID();
        localStorage.setItem('safety_user_id', uid);
        
        // Create profile in database
        await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: uid,
            phoneNumber: '',
            secretCode: 'Amma',
            isActive: true
          })
        });
      } else {
        // Load user settings
        const response = await fetch(`/api/profiles/${uid}`);
        if (response.ok) {
          const profile = await response.json();
          setPhoneNumber(profile.phoneNumber || '');
          setSecretCode(profile.secretCode || 'Amma');
        }
      }
      
      setUserId(uid);
    } catch (error: any) {
      console.error('Error initializing user:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize user session',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSave = (phone: string, code: string, thresholds: any) => {
    setPhoneNumber(phone);
    setSecretCode(code);
    setCurrentTab('dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-lg text-muted-foreground">Loading Safety System...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="error-screen">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold mb-2">Failed to Initialize</h1>
          <p className="text-muted-foreground mb-4">
            Could not create user session. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            data-testid="button-refresh"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="safety-app">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-title">
                Women's Safety Guardian
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Emergency Detection & Response System
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <EmergencyDashboard
              userId={userId}
              phoneNumber={phoneNumber}
              secretCode={secretCode}
              onOpenSettings={() => setCurrentTab('settings')}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel
              userId={userId}
              initialPhone={phoneNumber}
              initialSecretCode={secretCode}
              onSave={handleSettingsSave}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">
              Women's Safety Guardian • Comprehensive Protection System
            </p>
            <p>
              Features: Voice Code Detection • Motion & Light Tracking • Panic Sound Detection • Movement Analysis • Live GPS • WhatsApp Alerts • Buddy System • Safe Path Navigation
            </p>
            <p className="text-xs">
              Say your secret code 3 times or trigger 2+ sensors within 5 seconds to activate emergency alert
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
