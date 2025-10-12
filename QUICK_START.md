# Quick Start Guide - Women's Safety Guardian

## Get Started in 3 Minutes

### Step 1: Launch the App
```bash
npm run dev
```

### Step 2: Configure Settings
1. Open the app in your browser
2. Click **Settings** tab
3. Enter your emergency contact phone number (e.g., +1234567890)
4. Set your secret code (default: "Amma")
5. Click **Save Settings**

### Step 3: Start Monitoring
1. Go back to **Dashboard** tab
2. Click **Start Monitoring**
3. Grant all permissions when prompted:
   - ✅ Camera
   - ✅ Microphone
   - ✅ Location
   - ✅ Device Motion (on mobile)

## How to Trigger Emergency Alert

### Option 1: Voice Code (Easiest)
Say your secret code **3 times** clearly:
```
"Amma" ... "Amma" ... "Amma"
```
Watch the counter: 0/3 → 1/3 → 2/3 → 3/3 ✅

### Option 2: Multi-Sensor Detection
Do **2 or more** of these within **5 seconds**:
- 📹 Wave hands in front of camera (sudden motion)
- 🔊 Make a loud noise or shout
- 📱 Shake/move your device rapidly
- 💡 Cover camera then uncover (light change)

## What Happens When Alert Triggers

1. 🚨 Status changes to **"ALERT"** (red)
2. 📍 Your current location is captured
3. 📱 WhatsApp message sent to emergency contact:
   ```
   🚨 EMERGENCY ALERT

   User is in danger!

   Reason: motion, sound

   Location: https://maps.google.com/?q=12.345,67.890

   Please check on them immediately!
   ```
4. 📋 Alert logged in history with timestamp

## Features at a Glance

### Live Monitoring
- ✅ Real-time sensor graphs (Motion, Sound, Light, Movement)
- ✅ Live webcam feed
- ✅ Google Maps location tracking
- ✅ Voice detection counter

### Buddy System
- ✅ Connect with trusted contacts
- ✅ Share real-time location
- ✅ Send instant SOS to buddies
- ✅ View buddy locations on map

### Alert History
- ✅ Complete history of all alerts
- ✅ Location links for each incident
- ✅ WhatsApp delivery status
- ✅ Trigger reasons logged

### Customizable Settings
- ✅ Adjust all sensor sensitivities
- ✅ Configure detection thresholds
- ✅ Set confirmation time window
- ✅ Choose minimum sensors required

## Testing the System

### Test WhatsApp Alerts
1. Go to **Settings**
2. Enter phone number
3. Click **"Test WhatsApp Alert"**
4. Check WhatsApp for test message

**Note**: If Twilio is not configured, you'll see a simulated alert (all other features work normally)

### Test Voice Detection
1. Start monitoring
2. Say secret code 3 times
3. Watch counter increment
4. Alert triggers at 3/3

### Test Multi-Sensor
1. Start monitoring
2. Within 5 seconds:
   - Wave at camera
   - Clap hands loudly
   - Shake device
3. Watch graphs spike
4. Alert triggers when 2+ sensors activated

## Adjusting Sensitivity

If alerts trigger too easily or too rarely, adjust in Settings:

**Too Sensitive** (false alarms):
- ⬆️ Increase Motion Threshold (0.5 → 0.7)
- ⬆️ Increase Sound Threshold (0.8 → 0.9)
- ⬆️ Increase Sensors Required (2 → 3)

**Not Sensitive Enough**:
- ⬇️ Decrease Motion Threshold (0.5 → 0.3)
- ⬇️ Decrease Sound Threshold (0.8 → 0.6)
- ⬇️ Decrease Sensors Required (2 → 1)
- ⬆️ Increase Confirmation Window (5s → 7s)

## Adding Buddies

1. Get your User ID (shown in app)
2. Share with trusted friend
3. Friend adds your ID in Buddy System
4. Accept their request
5. Now you can:
   - See each other's locations
   - Send instant SOS alerts
   - Check on each other's safety

## Mobile Usage Tips

### Best Results:
- ✅ Use Chrome or Safari browser
- ✅ Keep app in foreground
- ✅ Grant all permissions
- ✅ Enable location services
- ✅ Connect to stable internet

### Battery Saving:
- Stop monitoring when not needed
- Reduce confirmation window
- Close other camera/mic apps

## Troubleshooting

### "No location available"
→ Grant location permission in browser settings

### "Voice detection not working"
→ Check microphone permission
→ Speak louder and clearer
→ Try different browser (Chrome recommended)

### "Camera not showing"
→ Close other apps using camera
→ Refresh page and grant permission again

### "WhatsApp not sending"
→ Verify phone number format (+countrycode + number)
→ Check if Twilio is configured
→ Use "Test WhatsApp Alert" button

## Demo Mode

Perfect for presentations and testing!

**Without Twilio configured:**
- ✅ All sensors work normally
- ✅ Alerts show as "simulated"
- ✅ Location tracking works
- ✅ Buddy system functional
- ✅ Settings persist
- ✅ Visual feedback provided

**To enable full WhatsApp alerts:**
1. Sign up at https://www.twilio.com/
2. Get WhatsApp API access
3. Configure credentials in Supabase
4. Test with "Test WhatsApp Alert"

## Production Deployment

```bash
npm run build
```

Deploy the `dist` folder to:
- Vercel
- Netlify
- Any static hosting

**Important**: HTTPS required for:
- Camera access
- Microphone access
- Location access
- Device motion

## Privacy & Security

- 🔒 All data stored securely in Supabase
- 🔒 Row Level Security on all tables
- 🔒 Location only captured during alerts
- 🔒 You control all your data
- 🔒 Buddy connections require consent
- 🔒 WhatsApp messages encrypted

## Support

Issues? Check:
1. Browser console for errors
2. All permissions granted
3. Internet connection stable
4. Try different browser

## Next Steps

1. ✅ Configure your settings
2. ✅ Test voice detection
3. ✅ Test multi-sensor
4. ✅ Add buddies
5. ✅ Test WhatsApp alerts
6. ✅ Adjust sensitivities
7. ✅ Start using for real!

---

**Remember**: This is your personal safety system. Keep it accessible and configured with real emergency contacts!

For full documentation, see `README_SAFETY_APP.md`
