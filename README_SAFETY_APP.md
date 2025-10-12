# Women's Safety Guardian - Comprehensive Protection System

A sophisticated AI-powered emergency detection and response system designed to protect women through multi-sensor monitoring, real-time alerts, and smart safety features.

## Features

### 1. Secret Code & Voice Trigger
- Enter a secret code or say it aloud 3 times (e.g., "Amma Amma Amma")
- Continuous microphone listening with voice recognition
- Adjustable sensitivity to avoid false triggers
- Fuzzy matching using Levenshtein distance algorithm

### 2. Multi-Sensor Emergency Detection
Confirms danger when 2 or more signals occur within a configurable time window (default 5 seconds):

- **Webcam Detection**: Sudden motion and light changes
- **Microphone**: Loud sounds and panic voice detection
- **Accelerometer/Gyroscope**: Running, falling, or unusual movements
- **ML-Enhanced**: Advanced pattern recognition for panic situations
- Smooth readings with averaging to reduce false positives
- Fully adjustable thresholds for all sensors

### 3. Live Location & WhatsApp Alerts
- Continuously tracks browser GPS location
- Shows Google Maps iframe with clickable location links
- Sends WhatsApp message via Twilio to configured phone number
- Alert format: "🚨 Emergency detected! User is in danger at [location]"
- Automatic retry mechanism for failed alerts
- Visual simulation mode when Twilio is not configured

### 4. Safe Path & Dangerous Area Prediction
- Predicts safest path to destination using multiple factors
- Considers traffic density, crowded areas, nearby shops
- Evaluates lighting conditions and open spaces
- Flags dangerous areas based on historical data and user reports
- Dynamic route updates to avoid danger zones
- Safety scoring for all path segments

### 5. Buddy System
- Connect with nearby users in real-time
- Check buddy profiles and locations
- Send quick SOS notifications to trusted contacts
- Real-time location sharing with buddies
- Mutual consent required for connections
- Accept/reject buddy requests

### 6. Live Sensor Monitoring
- Real-time graphs for all sensor data
- Motion, sound, light, and movement intensity charts
- Threshold indicators on all graphs
- Historical data tracking
- Visual feedback for all sensor states

### 7. Alert Management
- Complete alert history with timestamps
- Location links for each alert
- WhatsApp delivery status tracking
- Trigger reason logging
- Sensor data snapshots for each alert

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL with RLS)
- **Backend**: Supabase Edge Functions (Deno)
- **Charts**: Recharts
- **Alerts**: Twilio WhatsApp API
- **Maps**: Google Maps API

## Setup Instructions

### Prerequisites
1. Node.js 18+ installed
2. Supabase account (database already provisioned)
3. Twilio account (optional - for WhatsApp alerts)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
The `.env` file is already configured with Supabase credentials.

3. For WhatsApp alerts (optional):
   - Sign up for Twilio: https://www.twilio.com/
   - Get WhatsApp API access
   - Configure in Supabase dashboard:
     - TWILIO_ACCOUNT_SID
     - TWILIO_AUTH_TOKEN
     - TWILIO_WHATSAPP_NUMBER

### Running the Application

1. Start development server:
```bash
npm run dev
```

2. Open browser and navigate to the local URL shown

3. Grant permissions when prompted:
   - Camera access
   - Microphone access
   - Location access
   - Device motion (on mobile)

### Configuration

#### First Time Setup
1. Go to **Settings** tab
2. Enter your emergency contact phone number (include country code)
3. Set your secret voice code (default: "Amma")
4. Adjust sensor thresholds if needed
5. Click **Save Settings**
6. Test WhatsApp alerts using the "Test WhatsApp Alert" button

#### Adjusting Sensitivity
All thresholds are configurable in Settings:
- **Voice Sensitivity** (0.5-1.0): Higher = stricter matching
- **Motion Threshold** (0.1-1.0): Webcam motion sensitivity
- **Light Change** (0.1-1.0): Brightness change detection
- **Sound Threshold** (0.3-1.0): Loud sound and panic detection
- **Movement Intensity** (0.1-1.0): Accelerometer sensitivity
- **Confirmation Window** (3-10s): Multi-sensor time window
- **Sensors Required** (1-4): Minimum sensors for alert

## Usage Guide

### Starting Monitoring
1. Click "Start Monitoring" on the dashboard
2. Grant all requested permissions
3. The system will begin monitoring all sensors
4. Voice detection activates automatically

### Emergency Activation Methods

#### Method 1: Voice Code
- Say your secret code 3 times clearly
- Example: "Amma" "Amma" "Amma"
- Counter shows progress (0/3, 1/3, 2/3, 3/3)

#### Method 2: Multi-Sensor
- Trigger 2+ sensors within 5 seconds:
  - Sudden movement in front of camera
  - Loud sound or panic voice
  - Rapid phone movement (shake/run)
  - Sudden light changes

### When Alert Triggers
1. Emergency status changes to "ALERT"
2. Location is captured automatically
3. WhatsApp message sent to emergency contact
4. Alert logged in database
5. Visual and audio feedback provided

### Buddy System
1. Get your User ID from the system
2. Share with trusted contacts
3. Add buddies using their User IDs
4. Accept incoming buddy requests
5. View buddy locations in real-time
6. Send SOS to buddies when needed

### Safe Path Navigation
1. System automatically loads danger zones
2. Plan routes that avoid dangerous areas
3. Get safety scores for different paths
4. Real-time route adjustments

## Testing

### Voice Detection Test
1. Set secret code in Settings
2. Start monitoring
3. Say code 3 times clearly
4. Watch counter increment
5. Alert should trigger at 3/3

### Multi-Sensor Test
1. Start monitoring
2. Within 5 seconds, do:
   - Wave hand in front of camera
   - Make a loud sound
   - Shake your device
3. Watch graphs respond
4. Alert should trigger when 2+ sensors activated

### WhatsApp Test
1. Configure phone number in Settings
2. Click "Test WhatsApp Alert"
3. Check WhatsApp for message
4. If Twilio not configured, see simulated alert

## Deployment

Build for production:
```bash
npm run build
```

The app can be deployed to:
- Vercel
- Netlify
- Any static hosting service

## Database Schema

### Tables
- **profiles**: User settings and contact info
- **emergency_alerts**: Alert history with locations
- **sensor_thresholds**: Customizable detection settings
- **buddy_connections**: User connections and permissions
- **dangerous_zones**: Reported danger areas
- **safe_paths**: Historical safe routes

All tables have Row Level Security (RLS) enabled.

## Security Features

- RLS policies restrict data access to owners only
- Anonymous authentication for immediate use
- No user data exposed without authentication
- Secure WebSocket connections for real-time updates
- HTTPS enforced for all API calls
- WhatsApp messages encrypted by Twilio

## Troubleshooting

### Camera/Mic Not Working
- Grant permissions in browser settings
- Check if another app is using camera/mic
- Try different browser (Chrome/Edge recommended)

### Voice Detection Not Working
- Ensure microphone permission granted
- Speak clearly and loudly
- Adjust voice sensitivity in Settings
- Check browser console for errors

### Location Not Available
- Enable location services in browser
- Grant location permission
- Check if HTTPS is enabled (required for geolocation)

### WhatsApp Not Sending
- Verify phone number format (+country code)
- Check Twilio credentials configured
- Test using "Test WhatsApp Alert" button
- View simulated alert if Twilio not setup

### Sensors Not Triggering
- Lower threshold values in Settings
- Increase confirmation window time
- Reduce sensors required count
- Check sensor graphs for activity

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Limited (voice recognition may not work)
- **Mobile browsers**: Full support with device motion

## Performance Tips

1. Close other camera/mic using apps
2. Use modern browser for best performance
3. Grant all permissions on first load
4. Keep confirmation window ≤ 7 seconds
5. Monitor battery on mobile devices

## Privacy & Data

- All data stored in your Supabase instance
- Location data only captured during alerts
- Sensor data not permanently stored
- Buddy connections require mutual consent
- You control all your data

## Support & Issues

For issues or questions:
1. Check browser console for errors
2. Verify all permissions granted
3. Test in different browser
4. Check Supabase logs for Edge Function errors

## Demo Mode

If Twilio is not configured:
- Alerts show as "simulated"
- All other features work normally
- Perfect for testing and demonstrations
- Visual feedback still provided

## Future Enhancements

- Video recording during emergencies
- SMS fallback for WhatsApp
- Smart home integration
- Wearable device support
- ML model improvements
- Community danger zone reports
- Emergency services integration

## License

This project is for educational and safety purposes.
