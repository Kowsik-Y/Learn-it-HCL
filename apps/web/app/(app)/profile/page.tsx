'use client';

import { BookOpen, Settings, Shield, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_profileData, setProfileData] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    avatarUrl: '',
    bio: '',
    timezone: 'UTC',
    language: 'en',
    locale: 'en-US',
    ageRange: '',
    preferences: {
      preferredContentType: 'mixed',
      preferredStudyDurationMinutes: 30,
      preferredDifficulty: 'adaptive',
      projectOriented: true,
      mentorSupported: false,
    },
    currentPassword: '',
    newPassword: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await api.getProfile()) as any;
      setProfileData(data);

      setFormData({
        fullName: data.user?.fullName || '',
        avatarUrl: data.user?.avatarUrl || '',
        bio: data.learnerProfile?.bio || '',
        timezone: data.learnerProfile?.timezone || 'UTC',
        language: data.learnerProfile?.language || 'en',
        locale: data.learnerProfile?.locale || 'en-US',
        ageRange: data.learnerProfile?.ageRange || '',
        preferences: {
          preferredContentType: data.preferences?.preferredContentType || 'mixed',
          preferredStudyDurationMinutes: data.preferences?.preferredStudyDurationMinutes || 30,
          preferredDifficulty: data.preferences?.preferredDifficulty || 'adaptive',
          projectOriented: data.preferences?.projectOriented ?? true,
          mentorSupported: data.preferences?.mentorSupported ?? false,
        },
        currentPassword: '',
        newPassword: '',
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateProfile(formData);
      toast.success('Profile updated successfully');

      // Clear passwords after save
      if (formData.currentPassword || formData.newPassword) {
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      }

      await fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Profile Settings"
          description="Manage your account details and learning preferences."
        />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Profile Settings"
        description="Manage your account details and learning preferences."
      />

      <div className="mt-6 max-w-4xl">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Basic Info
            </TabsTrigger>
            <TabsTrigger value="learner" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security
            </TabsTrigger>
          </TabsList>

          {/* BASIC INFO TAB */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your name and avatar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* LEARNER PROFILE TAB */}
          <TabsContent value="learner">
            <Card>
              <CardHeader>
                <CardTitle>Learner Profile</CardTitle>
                <CardDescription>
                  Tell us a bit about yourself to personalize your experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="I am a software engineer looking to learn more about AI..."
                    className="h-32"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locale">Locale</Label>
                    <Input
                      id="locale"
                      value={formData.locale}
                      onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageRange">Age Range</Label>
                    <Input
                      id="ageRange"
                      value={formData.ageRange}
                      onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                      placeholder="e.g. 25-34"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* PREFERENCES TAB */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Learning Preferences</CardTitle>
                <CardDescription>Adjust how you want to interact with courses.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredContentType">Preferred Content Type</Label>
                    <Input
                      id="preferredContentType"
                      value={formData.preferences.preferredContentType}
                      onChange={(e) => updatePreference('preferredContentType', e.target.value)}
                      placeholder="e.g. video, text, mixed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredDifficulty">Preferred Difficulty</Label>
                    <Input
                      id="preferredDifficulty"
                      value={formData.preferences.preferredDifficulty}
                      onChange={(e) => updatePreference('preferredDifficulty', e.target.value)}
                      placeholder="e.g. beginner, adaptive"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studyDuration">Preferred Study Duration (Mins)</Label>
                    <Input
                      id="studyDuration"
                      type="number"
                      value={formData.preferences.preferredStudyDurationMinutes}
                      onChange={(e) =>
                        updatePreference(
                          'preferredStudyDurationMinutes',
                          parseInt(e.target.value, 10) || 30,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-3 mt-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={formData.preferences.projectOriented}
                      onCheckedChange={(checked) =>
                        updatePreference('projectOriented', checked as boolean)
                      }
                    />
                    <span className="text-sm font-medium">Project Oriented</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={formData.preferences.mentorSupported}
                      onCheckedChange={(checked) =>
                        updatePreference('mentorSupported', checked as boolean)
                      }
                    />
                    <span className="text-sm font-medium">Mentor Supported</span>
                  </label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* SECURITY TAB */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Update your password to keep your account secure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSave}
                  disabled={saving || (!formData.currentPassword && !formData.newPassword)}
                >
                  {saving ? 'Saving...' : 'Update Password'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
