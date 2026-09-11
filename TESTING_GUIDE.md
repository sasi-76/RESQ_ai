# 🧪 COMPLETE TESTING GUIDE

## **How to Test Every Feature in RESQAI**

---

## 🚀 **SETUP**

### **Prerequisites:**
```bash
# 1. Ensure dev server is running
npm run dev

# 2. Open browser
http://localhost:3002

# 3. Open DevTools (F12)
# Watch Console for logs
# Check Network tab for API calls
```

### **Before Testing:**
- ✅ Clear browser cache (Ctrl + Shift + Delete)
- ✅ Hard refresh (Ctrl + Shift + R)
- ✅ Check console for errors
- ✅ Verify all pages load

---

## 📊 **1. DASHBOARD TESTING**

### **Test Live Weather Data:**

```bash
1. Go to Dashboard (/)
2. Locate "Live Tamil Nadu Weather" card
3. Verify 8 cities shown:
   - Chennai
   - Coimbatore
   - Madurai
   - Tiruchirappalli
   - Salem
   - Tirunelveli
   - Cuddalore
   - Vellore

4. Check each city shows:
   ✅ Temperature in °C
   ✅ Weather icon (Sun/Cloud/Rain)
   ✅ Rainfall (mm)
   ✅ Wind speed (km/h)
   ✅ Humidity (%)

5. Test Auto-Refresh:
   ✅ Toggle OFF → Timer stops
   ✅ Toggle ON → Timer resumes
   ✅ Click "Refresh Now" → Data updates

6. Check "Last Updated" timestamp updates
```

### **Test Live Earthquakes:**

```bash
1. Locate "Earthquakes (Last 24h)" card
2. If earthquakes present:
   ✅ Magnitude shown
   ✅ Location shown
   ✅ Time ago shown
   ✅ Depth shown

3. If no earthquakes:
   ✅ "No significant earthquakes" message
   
4. Verify only TN region earthquakes (8°-13.5°N, 76.5°-80.5°E)
```

### **Test Resource Tracker:**

```bash
1. Locate "Resource Allocation" card
2. Verify 4 resource boxes:
   
   Teams:
   ✅ Shows X / 5 format
   ✅ Progress bar present
   ✅ "Available" label
   
   Personnel:
   ✅ Shows deployed / total
   ✅ Progress bar
   ✅ Accurate count
   
   Ambulances:
   ✅ Shows total (should be ~18-22)
   
   Beds:
   ✅ Shows available / total
   ✅ Should be ~240 / 1000+
   ✅ Progress bar

3. Check alert boxes below:
   ✅ Shows appropriate alerts based on resources
   ✅ Green = good capacity
   ✅ Yellow/Orange = warnings
```

### **Test Charts:**

```bash
1. Hazard Overview (Pie Chart):
   ✅ Shows 4 hazard types
   ✅ Percentages add to 100%
   ✅ Legend visible
   
2. Risk Trends (Line Chart):
   ✅ Shows risk over time
   ✅ X-axis = time
   ✅ Y-axis = risk percentage
   ✅ Hover shows tooltip

3. Recent Alerts (List):
   ✅ Shows latest 5 alerts
   ✅ Severity badges
   ✅ Timestamps
```

**Expected Results:** ✅ All data displays, auto-refresh works, charts render

---

## 🚨 **2. ALERTS PAGE TESTING**

### **Test Alert List:**

```bash
1. Go to /alerts
2. Verify alert cards show:
   ✅ Severity badge (Critical/High/Medium/Low)
   ✅ Alert type (Flood/Cyclone/Earthquake)
   ✅ Location
   ✅ Affected population
   ✅ Timestamp
   ✅ Status (Active/Resolved)

3. Count alerts:
   ✅ Should have 5-10 sample alerts
```

### **Test Filter Buttons:**

```bash
1. Click "All" button:
   ✅ Shows all alerts
   ✅ Button highlighted

2. Click "Active" button:
   ✅ Only active alerts shown
   ✅ Resolved alerts hidden
   ✅ Button highlighted

3. Click "Resolved" button:
   ✅ Only resolved alerts shown
   ✅ Active alerts hidden
   ✅ Button highlighted

4. Click back to "All":
   ✅ All alerts visible again
```

### **Test Mark Resolved:**

```bash
1. Find an ACTIVE alert
2. Click "Mark Resolved" button
3. Verify:
   ✅ Button changes to "Reopen"
   ✅ Alert gets green checkmark
   ✅ Status changes to "Resolved"
   ✅ Filter "Active" hides it
   ✅ Filter "Resolved" shows it
   ✅ Notification appears (top-right)

Console should show:
"✅ Marked alert as resolved: [alert-id]"
```

### **Test Reopen:**

```bash
1. Find a RESOLVED alert
2. Click "Reopen" button
3. Verify:
   ✅ Button changes back to "Mark Resolved"
   ✅ Checkmark disappears
   ✅ Status changes to "Active"
   ✅ Filter "Resolved" hides it
   ✅ Filter "Active" shows it
   ✅ Notification appears

Console should show:
"🔄 Reopened alert: [alert-id]"
```

### **Test Details Modal:**

```bash
1. Click "Details" button on any alert
2. Verify modal opens with:
   ✅ Alert title
   ✅ Full description
   ✅ Location coordinates
   ✅ Affected population
   ✅ Severity level
   ✅ Type
   ✅ Status
   ✅ Timestamp
   ✅ Safety precautions list
   ✅ Emergency contacts

3. Test emergency contacts:
   ✅ 108 - Ambulance
   ✅ 101 - Fire Service
   ✅ 100 - Police
   ✅ 104 - Health Helpline
   ✅ 1077 - Disaster Management

4. Close modal:
   ✅ Click X button → Modal closes
   ✅ Click outside → Modal closes
   ✅ Press Esc → Modal closes
```

**Expected Results:** ✅ All filters work, resolve/reopen functional, modal displays correctly

---

## 🗺️ **3. MAP VIEW TESTING**

### **Test Map Loading:**

```bash
1. Go to /map
2. Verify:
   ✅ Map loads within 2 seconds
   ✅ Shows Tamil Nadu region
   ✅ OpenStreetMap tiles load
   ✅ No console errors

3. Test controls:
   ✅ Zoom in (+) works
   ✅ Zoom out (-) works
   ✅ Pan (drag) works
   ✅ Double-click zoom works
```

### **Test Monitored Areas:**

```bash
1. Count markers:
   ✅ Should see 6 markers
   
2. Find each area:
   - Chidambaram
   - Cuddalore North
   - Cuddalore Port
   - Virudhachalam
   - Neyveli
   - Parangipettai

3. Check marker colors:
   ✅ Red = Critical risk
   ✅ Orange = High risk
   ✅ Yellow = Medium risk
   ✅ Green = Low risk

4. Verify circles:
   ✅ 100km radius circles around markers
   ✅ Semi-transparent
```

### **Test Popups:**

```bash
1. Click on each marker
2. Verify popup shows:
   ✅ Area name
   ✅ Risk level (%)
   ✅ Hazard type
   ✅ Status
   ✅ Monitored areas badge
   
3. Close popup:
   ✅ Click X → closes
   ✅ Click elsewhere → closes
```

**Expected Results:** ✅ Map renders, all markers clickable, popups display

---

## 🏥 **4. HOSPITALS TESTING**

### **Test Hospital List:**

```bash
1. Go to /hospitals
2. Verify 5 hospitals shown:
   - Cuddalore Government Hospital
   - JIPMER Puducherry
   - Rajah Muthiah Medical College
   - Mundiyampakkam Hospital
   - Private Multi-Specialty Cuddalore

3. Each hospital card shows:
   ✅ Name
   ✅ Total beds
   ✅ Free beds
   ✅ Ambulances count
   ✅ Distance (should NOT be 0.00 km)
   ✅ 3 action buttons
```

### **Test Details Button:**

```bash
1. Click "Details" on any hospital
2. Verify modal shows:
   ✅ Hospital name
   ✅ Location coordinates
   ✅ Total beds
   ✅ Available beds
   ✅ Bed capacity percentage
   ✅ Ambulances count
   ✅ Estimated travel time
   ✅ Contact phone number

3. Close modal:
   ✅ Click X → closes
   ✅ Click outside → closes
```

### **Test Call Ambulance:**

```bash
1. Click "Call Ambulance" on any hospital
2. Verify:
   ✅ Alert dialog appears
   ✅ Shows "Dispatching ambulance from [Hospital Name]"
   ✅ Click OK → alert closes
   ✅ Console shows: "🚑 Calling ambulance from: [Hospital Name]"
   
Expected: Alert should appear (current functionality)
Pending: Reduce ambulance count (future enhancement)
```

### **Test Get Directions:**

```bash
1. Click "Get Directions" on any hospital
2. Verify:
   ✅ New tab opens
   ✅ Google Maps loads
   ✅ Shows route to hospital
   ✅ Hospital location marked
   
3. Check URL format:
   Should be: https://www.google.com/maps/dir/?api=1&destination=lat,lng
```

**Expected Results:** ✅ All buttons work, details modal displays, directions open Google Maps

---

## 👥 **5. TEAMS TESTING**

### **Test Team List:**

```bash
1. Go to /teams
2. Verify 5 teams shown:
   - RESQ-01 Alpha (12 personnel)
   - RESQ-02 Bravo (10 personnel)
   - RESQ-03 Charlie (15 personnel)
   - RESQ-04 Delta (8 personnel)
   - RESQ-05 Echo (14 personnel)

3. Check stats at top:
   ✅ Total Teams: 5
   ✅ Deployed: count of deployed
   ✅ Standby: count on standby
   ✅ Numbers should add up
```

### **Test Deploy Button:**

```bash
1. Find a STANDBY team (yellow badge)
2. Click "Deploy" button
3. Enter location when prompted:
   Example: "Cuddalore"
4. Enter mission when prompted:
   Example: "Flood rescue operation"
   
5. Verify:
   ✅ Team status changes to "DEPLOYED" (green)
   ✅ Location updates to entered location
   ✅ Mission description shows
   ✅ Deployed count increases
   ✅ Standby count decreases
   ✅ Notification appears top-right
   ✅ Deploy button changes to Recall

Console should show:
"🚀 Deploying team: RESQ-XX [Name]"
"Location: [your location]"
"Mission: [your mission]"
```

### **Test Recall Button:**

```bash
1. Find a DEPLOYED team (green badge)
2. Click "Recall" button
3. Confirm dialog appears
4. Click "OK"

5. Verify:
   ✅ Team status changes to "STANDBY" (yellow)
   ✅ Location resets to "Base"
   ✅ Mission clears
   ✅ Deployed count decreases
   ✅ Standby count increases
   ✅ Notification appears
   ✅ Recall button changes to Deploy

Console should show:
"🏠 Recalling team: RESQ-XX [Name]"
```

### **Test Reassign Button:**

```bash
1. Click "Reassign" on any team
2. Enter new location when prompted:
   Example: "Chennai"
3. Verify:
   ✅ Location updates
   ✅ If standby → deploys to new location
   ✅ If deployed → changes location
   ✅ Notification appears

Console should show:
"📍 Reassigning team: RESQ-XX to [new location]"
```

### **Test Resource Integration:**

```bash
1. Open Dashboard in one tab
2. Open Teams in another tab
3. Deploy a team in Teams tab
4. Switch to Dashboard tab
5. Verify:
   ✅ Resource Tracker shows reduced available teams
   ✅ Personnel count decreases
   ✅ Deployed count increases
   ✅ Progress bar adjusts

6. Recall the team
7. Verify Dashboard updates again:
   ✅ Available teams increase
   ✅ Personnel returns
```

**Expected Results:** ✅ All buttons functional, stats update, notifications appear, resource integration works

---

## 🎖️ **6. MISSION STATUS TESTING**

### **Test Active Missions Display:**

```bash
1. Deploy 2-3 teams first (from Teams page)
2. Go to /missions
3. Verify stats at top:
   ✅ Active Missions: count of deployed teams
   ✅ Completed Today: 0 (or previous count)
   ✅ Personnel Deployed: sum of all deployed team members

4. Check mission cards show:
   ✅ Team ID badge
   ✅ Team name
   ✅ Leader name
   ✅ Location
   ✅ Mission description
   ✅ Personnel count
   ✅ Duration (updates live - hours/minutes)
   ✅ Deployment timestamp
   ✅ "IN PROGRESS" pulsing badge
   ✅ "Mark Mission Complete" button
```

### **Test Mission Duration:**

```bash
1. Watch a mission card
2. Duration should show format:
   "0h 1m" (just deployed)
   "0h 5m" (after 5 minutes)
   "1h 30m" (after 90 minutes)
   
3. Verify duration updates automatically
4. Check it matches deployment time
```

### **Test Mission Completion:**

```bash
1. Click "Mark Mission Complete" on any mission
2. Verify modal opens showing:
   ✅ Team name
   ✅ Location
   ✅ Personnel count
   ✅ Duration
   ✅ Resource return notice
   ✅ Completion report textarea
   ✅ "Confirm & Return Team" button
   ✅ "Cancel" button

3. Try submitting without report:
   ✅ Alert: "Please provide a mission completion report"
   ✅ Form doesn't submit

4. Enter completion report:
   Example: "Successfully rescued 15 people from flooded area. Provided medical aid. Area secured."
   
5. Click "Confirm & Return Team"

6. Verify:
   ✅ Modal closes
   ✅ Mission disappears from active list
   ✅ Active Missions count decreases
   ✅ Completed Today count increases
   ✅ Personnel Deployed decreases
   ✅ Notification appears:
      "MISSION COMPLETED - [Team Name] mission completed..."
   ✅ Team returns to standby (check Teams page)
   ✅ Resources restored (check Dashboard)

Console should show:
"✅ Marking mission complete for: [Team Name]"
"📝 Report: [your report]"
"✅ Mission completed: [Team Name]"
```

### **Test Cancel:**

```bash
1. Click "Mark Mission Complete"
2. Enter some text in report
3. Click "Cancel"
4. Verify:
   ✅ Modal closes
   ✅ Report cleared
   ✅ Mission still active
   ✅ No changes to resources
```

### **Test No Active Missions:**

```bash
1. Recall all teams (Teams page)
2. Go to Missions page
3. Verify:
   ✅ Shows "No active missions" message
   ✅ Checkmark icon displayed
   ✅ "All teams on standby" text
   ✅ Active Missions: 0
```

**Expected Results:** ✅ Missions display correctly, completion workflow works, resources return, notifications show

---

## 💡 **7. RECOMMENDATIONS TESTING**

### **Test Display:**

```bash
1. Go to /recommendations
2. Verify 5-8 recommendation cards show
3. Each card should have:
   ✅ Priority badge (Critical/High/Medium/Low)
   ✅ Action description
   ✅ Location
   ✅ Resources needed
   ✅ Response time estimate
   ✅ Affected population
   ✅ 3 action buttons (currently static)

4. Check priority colors:
   ✅ Critical = Red
   ✅ High = Orange
   ✅ Medium = Yellow
   ✅ Low = Blue
```

### **Test Buttons (Current State):**

```bash
NOTE: Buttons currently don't have functionality

1. "Deploy Team" button:
   ⚠️ Currently no onClick handler
   🟡 Pending implementation

2. "Dispatch Ambulance" button:
   ⚠️ Currently no onClick handler
   🟡 Pending implementation

3. "Mark Done" button:
   ⚠️ Currently no onClick handler
   🟡 Pending implementation

Expected: This is on pending tasks list
```

**Expected Results:** ✅ Recommendations display with data, 🟡 Buttons pending functionality

---

## 🤖 **8. AI ADMIN TESTING**

### **Test AI Workflow:**

```bash
1. Go to /admin
2. Verify 8-step workflow diagram shows:
   ✅ 1. Data Collection
   ✅ 2. Data Processing
   ✅ 3. Hazard Detection
   ✅ 4. Risk Assessment
   ✅ 5. Change Detection
   ✅ 6. Alert Generation
   ✅ 7. Resource Optimization
   ✅ 8. Controller Review
   
3. Check visual elements:
   ✅ Icons for each step
   ✅ Connecting arrows
   ✅ Color coding
```

### **Test AI Decisions List:**

```bash
1. Locate "AI Decisions" section
2. Should see 3-5 sample decisions
3. Each decision shows:
   ✅ Decision ID
   ✅ Type (Deploy Team/Evacuate/Monitor)
   ✅ Location
   ✅ Risk score %
   ✅ Confidence %
   ✅ Resources needed
   ✅ Rationale text
   ✅ Status badge
   ✅ Timestamp
   ✅ Action buttons (Approve/Reject)
```

### **Test Filter Buttons:**

```bash
1. Click "All":
   ✅ Shows all decisions
   ✅ Button highlighted

2. Click "Approved":
   ✅ Only approved decisions shown
   ✅ Button highlighted

3. Click "Pending":
   ✅ Only pending decisions shown
   ✅ Button highlighted

4. Click "Rejected":
   ✅ Only rejected decisions shown (if any)
   ✅ Button highlighted
```

### **Test Approve Button:**

```bash
1. Find a PENDING decision
2. Click "Approve" button
3. Verify:
   ✅ Status changes to "APPROVED" (green badge)
   ✅ Buttons disappear
   ✅ Notification appears
   ✅ Team auto-deploys (check Teams page)
   ✅ Alert created (check Alerts page)
   ✅ Resources allocated (check Dashboard)

Console should show:
"✅ Approved AI decision: [decision-id]"
"Deploying team for approved AI decision"
```

### **Test Reject Button:**

```bash
1. Find a PENDING decision
2. Click "Reject" button
3. Prompt appears: "Reason for rejection?"
4. Enter reason:
   Example: "Insufficient evidence for deployment"
5. Verify:
   ✅ Status changes to "REJECTED" (red badge)
   ✅ Buttons disappear
   ✅ Notification appears
   ✅ No team deployed
   ✅ No alert created

Console should show:
"❌ Rejected AI decision: [decision-id]"
"Reason: [your reason]"
```

### **Test Integration with Demo Controls:**

```bash
1. Go to Demo Controls (/demo)
2. Create a disaster:
   - Location: Cuddalore
   - Type: Flood
   - Risk: 75%
   - Population: 5000
3. Click "Create Disaster"

4. Go back to AI Admin (/admin)
5. Verify:
   ✅ New AI decision appears
   ✅ Status: PENDING
   ✅ Risk matches (75%)
   ✅ Location matches (Cuddalore)
   ✅ Type matches (Flood)

6. Approve the decision
7. Verify:
   ✅ Team deployed automatically
   ✅ Alert created
   ✅ Check Teams page → 1 team deployed
```

**Expected Results:** ✅ All filters work, approve/reject functional, auto-deployment works

---

## ⚡ **9. DEMO CONTROLS TESTING**

### **Test Disaster Creation:**

```bash
1. Go to /demo
2. Fill disaster form:
   - Location: Select "Cuddalore"
   - Type: Select "Flood"
   - Risk Level: Slide to 80%
   - Affected Population: Enter "10000"

3. Click "Create Disaster with AI"
4. Verify:
   ✅ Success notification appears
   ✅ Alert created (check Alerts page)
   ✅ AI decision generated (check AI Admin)
   ✅ Console shows disaster object

Console should show:
"🚨 Creating disaster..."
"Added disaster: flood-[timestamp]"
```

### **Test Hospital Routing:**

```bash
1. Click "Find Nearest Hospital & Route" button
2. Select location: "Cuddalore"
3. Click OK

4. Verify modal opens with:
   ✅ Nearest hospital name
   ✅ Distance (should NOT be 0.00 km)
      - If < 1 km: shows meters (e.g., "250m")
      - If ≥ 1 km: shows km (e.g., "2.5 km")
   ✅ Travel time (minimum 1 minute)
   ✅ Turn-by-turn directions list
   ✅ Hospital capacity info
   ✅ Free beds count
   ✅ Ambulances available

5. Check directions format:
   ✅ "Head northeast from disaster site"
   ✅ "Follow NH-45C for X km"
   ✅ "Turn right onto Hospital Road"
   ✅ "Arrive at [Hospital Name]"

Console should show:
"🏥 Finding nearest hospital for: Cuddalore"
"Nearest hospital: [Hospital Name]"
"Distance: [X] km"
```

### **Test All Locations:**

```bash
Test hospital routing for each location:

1. Chidambaram:
   ✅ Should find nearest hospital
   ✅ Distance: ~2.5 km
   ✅ Travel time: ~3-5 min

2. Cuddalore:
   ✅ Should find nearest hospital
   ✅ Distance: ~1.0 km
   ✅ Travel time: ~2-3 min

3. Virudhachalam:
   ✅ Should calculate correct distance
   ✅ Not 0.00 km

4. Test other areas:
   - Neyveli
   - Parangipettai
   - Cuddalore Port

All should show realistic distances and times
```

### **Test Disaster Types:**

```bash
Create one disaster of each type:

1. Flood:
   ✅ Creates flood alert
   ✅ AI recommends boat rescue
   ✅ High priority

2. Cyclone:
   ✅ Creates cyclone alert
   ✅ AI recommends evacuation
   ✅ Critical priority

3. Earthquake:
   ✅ Creates earthquake alert
   ✅ AI recommends structural assessment
   ✅ High priority

4. Volcano:
   ✅ Creates volcano alert
   ✅ AI recommends evacuation
   ✅ Critical priority
```

**Expected Results:** ✅ Disasters created, AI decisions generated, hospital routing accurate

---

## 🔔 **10. NOTIFICATIONS TESTING**

### **Test Auto-Dismiss:**

```bash
1. Trigger any notification (deploy team, approve decision, etc.)
2. Don't click close button
3. Wait 5 seconds
4. Verify:
   ✅ Notification fades out automatically
   ✅ Disappears from screen
   ✅ No errors in console
```

### **Test Manual Close:**

```bash
1. Trigger a notification
2. Immediately click the X button
3. Verify:
   ✅ Notification closes instantly
   ✅ Doesn't wait 5 seconds
```

### **Test Multiple Notifications:**

```bash
1. Quickly trigger 3-4 notifications:
   - Deploy a team
   - Approve an AI decision
   - Resolve an alert
   - Recall a team

2. Verify:
   ✅ All notifications appear
   ✅ Stack vertically (top-right)
   ✅ Don't overlap
   ✅ Each auto-dismisses after 5s
   ✅ Dismiss in order (oldest first)
```

### **Test Notification Types:**

```bash
Test each severity level:

1. Critical (Red):
   - Create disaster with 90% risk
   ✅ Red background
   ✅ Alert triangle icon

2. High (Orange):
   - Deploy team
   ✅ Orange background
   ✅ Alert icon

3. Medium (Blue):
   - Mark alert resolved
   ✅ Blue background
   ✅ Info icon

4. Low (Green):
   - Recall team successfully
   ✅ Green background
   ✅ Checkmark icon
```

**Expected Results:** ✅ All notifications appear, auto-dismiss works, manual close works, multiple stack correctly

---

## 🔧 **11. INTEGRATION TESTS**

### **Full Workflow Test:**

```bash
Complete disaster response workflow:

1. CREATE DISASTER (Demo Controls):
   - Location: Cuddalore
   - Type: Flood
   - Risk: 85%
   - Population: 8000
   ✅ Disaster created

2. CHECK AI DECISION (AI Admin):
   ✅ New decision appears
   ✅ Status: PENDING
   ✅ Risk: 85%

3. APPROVE DECISION (AI Admin):
   ✅ Click Approve
   ✅ Status → APPROVED
   ✅ Team auto-deploys

4. VERIFY TEAM DEPLOYED (Teams):
   ✅ One team shows DEPLOYED
   ✅ Location: Cuddalore
   ✅ Mission shows

5. CHECK RESOURCES (Dashboard):
   ✅ Available teams decreased by 1
   ✅ Personnel deployed increased
   ✅ Progress bar adjusted
   ✅ Alert if only 1 team left

6. CHECK ALERT (Alerts):
   ✅ New alert created
   ✅ Status: ACTIVE
   ✅ Location: Cuddalore

7. CHECK MISSION (Mission Status):
   ✅ Active mission shows
   ✅ Duration counting
   ✅ Team details visible

8. COMPLETE MISSION (Mission Status):
   - Click "Mark Mission Complete"
   - Enter report: "Rescued 20 people, area secured"
   - Confirm
   ✅ Mission removed
   ✅ Team recalled

9. VERIFY RESOURCES RETURNED (Dashboard):
   ✅ Available teams increased by 1
   ✅ Personnel returned
   ✅ Progress bar restored

10. RESOLVE ALERT (Alerts):
    - Click "Mark Resolved"
    ✅ Status → RESOLVED
    ✅ Green checkmark

FULL CYCLE COMPLETE! 🎉
```

### **Cross-Page Update Test:**

```bash
Test state synchronization:

1. Open 3 tabs:
   - Tab 1: Dashboard
   - Tab 2: Teams
   - Tab 3: Mission Status

2. In Tab 2 (Teams):
   - Deploy RESQ-01 Alpha

3. Switch to Tab 1 (Dashboard):
   - Refresh page (F5)
   ✅ Available teams decreased
   ✅ Resource tracker updated

4. Switch to Tab 3 (Mission Status):
   - Refresh page (F5)
   ✅ New active mission appears
   ✅ Duration counting

5. In Tab 3 complete the mission

6. Switch to Tab 2 (Teams):
   - Refresh page (F5)
   ✅ Team back to STANDBY

7. Switch to Tab 1 (Dashboard):
   - Refresh page (F5)
   ✅ Resources restored
```

---

## 📋 **TESTING CHECKLIST**

### **Before Each Test Session:**
- [ ] Clear browser cache
- [ ] Hard refresh (Ctrl + Shift + R)
- [ ] Open DevTools console
- [ ] Check for JavaScript errors
- [ ] Verify dev server running

### **Dashboard:**
- [ ] Live weather displays
- [ ] Live earthquakes display
- [ ] Resource tracker shows correct counts
- [ ] Auto-refresh toggle works
- [ ] Charts render
- [ ] Stats update

### **Alerts:**
- [ ] All alerts display
- [ ] Filter buttons work
- [ ] Mark resolved works
- [ ] Reopen works
- [ ] Details modal opens
- [ ] Emergency contacts shown

### **Map:**
- [ ] Map loads
- [ ] 6 markers visible
- [ ] Popups display
- [ ] Colors match risk
- [ ] Zoom/pan works

### **Hospitals:**
- [ ] 5 hospitals listed
- [ ] Details button works
- [ ] Call Ambulance works
- [ ] Get Directions opens Google Maps
- [ ] Distances NOT 0.00 km

### **Teams:**
- [ ] 5 teams listed
- [ ] Deploy button works
- [ ] Recall button works
- [ ] Reassign button works
- [ ] Stats update
- [ ] Notifications appear

### **Mission Status:**
- [ ] Active missions show
- [ ] Duration updates live
- [ ] Mark complete works
- [ ] Report required
- [ ] Resources return
- [ ] Team recalled

### **Recommendations:**
- [ ] Cards display
- [ ] Priority badges show
- [ ] Data accurate

### **AI Admin:**
- [ ] Workflow diagram shows
- [ ] Decisions listed
- [ ] Approve works
- [ ] Reject works
- [ ] Filters work
- [ ] Auto-deploy on approve

### **Demo Controls:**
- [ ] Disaster creation works
- [ ] Hospital routing accurate
- [ ] Distances correct
- [ ] All types work

### **Notifications:**
- [ ] Appear on actions
- [ ] Auto-dismiss after 5s
- [ ] Manual close works
- [ ] Multiple stack correctly

### **Integration:**
- [ ] Full workflow completes
- [ ] Cross-page updates work
- [ ] State persists across pages
- [ ] No data loss

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Page Won't Load**
```bash
1. Check dev server running:
   npm run dev

2. Check URL correct:
   http://localhost:3002

3. Clear cache and refresh:
   Ctrl + Shift + Delete
   Ctrl + Shift + R

4. Check console for errors:
   F12 → Console tab
```

### **Issue: Buttons Don't Work**
```bash
1. Check console for errors
2. Verify onClick handlers present
3. Check AppContext imported
4. Verify functions in context value
5. Hard refresh page
```

### **Issue: Resources Don't Update**
```bash
1. Check AppContext.jsx
2. Verify getResourceStats() exists
3. Check ResourceTracker component imported
4. Refresh page
5. Deploy/recall team again
```

### **Issue: Notifications Don't Appear**
```bash
1. Check Notifications.jsx imported in Layout
2. Verify showNotification in context
3. Check notification position (top-right)
4. Look for z-index issues
5. Check console for errors
```

### **Issue: Live Data Not Loading**
```bash
1. Check API keys in .env
2. Check liveDataService.js
3. Verify fetch requests in Network tab
4. Check for CORS errors
5. API may be rate-limited (wait 1 minute)
```

---

## ✅ **SUCCESS CRITERIA**

After running all tests, you should have:

✅ All pages load without errors  
✅ All buttons perform actions  
✅ All filters work correctly  
✅ All modals open and close  
✅ All notifications appear  
✅ Resources track correctly  
✅ Teams deploy and recall  
✅ Missions complete and return resources  
✅ Live data refreshes  
✅ Cross-page integration works  
✅ No console errors  
✅ Full workflow completes  

---

**Testing Complete!** 🎉

**If any test fails, refer to:**
- PENDING_TASKS.md - Known issues
- Console errors - Debug info
- Network tab - API issues
- This guide - Expected behavior
