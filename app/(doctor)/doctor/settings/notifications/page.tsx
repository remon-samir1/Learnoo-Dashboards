import React from 'react';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import SettingsActionButtons from '@/components/settings/SettingsActionButtons';
import Toggle from '@/components/ui/Toggle';

export default function NotificationsSettingsPage() {
  const channelSettings = [
    { title: 'Push Notifications', description: 'Send push notifications to the student app', checked: true },
    { title: 'Email Notifications', description: 'Send email notifications to students', checked: true },
    { title: 'SMS Notifications', description: 'Send SMS messages for critical alerts', checked: false },
  ];

  const adminAlerts = [
    { title: 'New Student Registration', description: 'Alert when a new student registers', checked: true },
    { title: 'Exam Results Published', description: 'Alert when exam results are available', checked: true },
    { title: 'Live Session Reminder', description: 'Remind 15 minutes before session starts', checked: true },
    { title: 'Community Flag Alert', description: 'Alert when a post is flagged by students', checked: true },
  ];

  return (
    <div className="flex flex-col h-full">
      <SettingsPageHeader 
        title="Notification Settings" 
        description="Email templates and push notification defaults" 
      />

      <SettingsSection title="Channels">
        <div className="flex flex-col">
          {channelSettings.map((item, index) => (
            <div key={index} className={`flex items-center justify-between py-4 ${index !== channelSettings.length - 1 ? 'border-b border-[#F8FAFC]' : ''}`}>
              <div>
                <h3 className="text-[14px] font-semibold text-[#111827]">{item.title}</h3>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{item.description}</p>
              </div>
              <Toggle initialChecked={item.checked} />
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Admin Alerts">
        <div className="flex flex-col">
          {adminAlerts.map((item, index) => (
            <div key={index} className={`flex items-center justify-between py-4 ${index !== adminAlerts.length - 1 ? 'border-b border-[#F8FAFC]' : ''}`}>
              <div>
                <h3 className="text-[14px] font-semibold text-[#111827]">{item.title}</h3>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{item.description}</p>
              </div>
              <Toggle initialChecked={item.checked} />
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsActionButtons />
    </div>
  );
}
