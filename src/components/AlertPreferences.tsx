import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Mail, Clock, Save, Loader2 } from 'lucide-react';

interface AlertPrefs {
  email_daily_digest: boolean;
  email_instant_alerts: boolean;
  notify_price_changes: boolean;
  notify_content_changes: boolean;
  notify_feature_updates: boolean;
  digest_time: string;
}

const AlertPreferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<AlertPrefs>({
    email_daily_digest: true,
    email_instant_alerts: false,
    notify_price_changes: true,
    notify_content_changes: true,
    notify_feature_updates: true,
    digest_time: '09:00'
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Use any to bypass strict type checking for tables not in types.ts
      const { data, error } = await (supabase as any)
        .from('alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const prefs = data as unknown as AlertPrefs & { id: string };
        setPreferences({
          email_daily_digest: prefs.email_daily_digest,
          email_instant_alerts: prefs.email_instant_alerts,
          notify_price_changes: prefs.notify_price_changes,
          notify_content_changes: prefs.notify_content_changes,
          notify_feature_updates: prefs.notify_feature_updates,
          digest_time: prefs.digest_time
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await (supabase as any)
        .from('alert_preferences')
        .upsert({
          user_id: user.id,
          ...preferences
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alert Preferences
        </CardTitle>
        <CardDescription>
          Configure how and when you receive competitor intelligence alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Notifications
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="daily-digest">Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a summary of all competitor activity once per day
              </p>
            </div>
            <Switch
              id="daily-digest"
              checked={preferences.email_daily_digest}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, email_daily_digest: checked })
              }
            />
          </div>

          {preferences.email_daily_digest && (
            <div className="flex items-center gap-4 ml-4 p-3 bg-muted/50 rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="digest-time" className="text-sm">Delivery Time</Label>
              <Select
                value={preferences.digest_time}
                onValueChange={(value) => 
                  setPreferences({ ...preferences, digest_time: value })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="instant-alerts">Instant Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified immediately when significant changes are detected
              </p>
            </div>
            <Switch
              id="instant-alerts"
              checked={preferences.email_instant_alerts}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, email_instant_alerts: checked })
              }
            />
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-medium">Alert Types</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="price-changes">Price Changes</Label>
              <p className="text-sm text-muted-foreground">
                Notify when competitors update their pricing
              </p>
            </div>
            <Switch
              id="price-changes"
              checked={preferences.notify_price_changes}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, notify_price_changes: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="content-changes">Content Updates</Label>
              <p className="text-sm text-muted-foreground">
                Notify when website content or messaging changes
              </p>
            </div>
            <Switch
              id="content-changes"
              checked={preferences.notify_content_changes}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, notify_content_changes: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="feature-updates">Feature Updates</Label>
              <p className="text-sm text-muted-foreground">
                Notify when new features or products are announced
              </p>
            </div>
            <Switch
              id="feature-updates"
              checked={preferences.notify_feature_updates}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, notify_feature_updates: checked })
              }
            />
          </div>
        </div>

        <Button onClick={savePreferences} disabled={saving} className="w-full gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};

export default AlertPreferences;
