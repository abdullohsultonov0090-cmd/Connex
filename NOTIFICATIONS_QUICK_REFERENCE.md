# 🔔 Advanced Notifications - Quick Reference Guide

## User Features

### Viewing Notifications
1. Click the **"Notif"** button in the top navigation (shows unread count badge)
2. The notifications panel slides down from the top
3. **Press ESC** or click the **✕** button to close

### Filtering by Category
Click any of these tabs to filter notifications:
- **Barchasi** (All) - View all notifications
- **Eslatmalar** (Mentions) - When someone mentions you
- **Rahmasiz** (Likes) - When someone likes your post
- **Sharhlar** (Comments) - When someone comments on your post

Each tab shows an **unread count badge** (red number) indicating new notifications in that category.

### Taking Actions
Hover over any notification to reveal **4 action buttons**:
- **❤️ Like** (Red) - React with appreciation
- **↩️ Reply** (Cyan) - Send a reply message
- **➕ Follow** (Green) - Follow the user
- **✕ Dismiss** (Gray) - Remove the notification

**On mobile**: Action buttons are always visible for easy tapping.

### Managing Settings
1. Click the **⚙️ Settings** (gear icon) in the notification header
2. A dropdown menu appears with 4 checkboxes:
   - **Barchasi faol** - Enable/disable all notifications
   - **Like bildirishnomalarini ko'rsatish** - Show/hide likes
   - **Izoh bildirishnomalarini ko'rsatish** - Show/hide comments
   - **Eslatlashlarni ko'rsatish** - Show/hide mentions
3. Click outside the dropdown to close it

Your preferences are **automatically saved** in your browser.

---

## Developer Features

### Adding a New Notification

```javascript
addNotificationWithPing(
  'User Name',              // Who triggered the notification
  'action text',            // What they did (e.g., "liked your post")
  'detailed description',   // More context
  'mentions',               // Category: 'all', 'mentions', 'likes', or 'comments'
  '2 min'                   // Time ago
)
```

### Example Notifications

```javascript
// When someone likes a post
addNotificationWithPing('Ali Valiyev', 'postingizga rahmasiz qo\'ydi', 
  'Eng so\'nggi postingizga yoqdi', 'likes', '5 min')

// When someone follows you
addNotificationWithPing('Nisa Karim', 'sizni kuzatish boshladi',
  'Yangi odam sizi kuzatmoqda', 'mentions', 'yangi')

// When someone comments
addNotificationWithPing('Jamila Hojaeva', 'postingizga shart qoldirdi',
  'Nima deyarkan, bu ajoyib post!', 'comments', '12 min')

// Direct message (general notification)
addNotificationWithPing('Behzod Rahimov', 'sizga xabar yubordi',
  'Direct message from user', 'all', '25 min')
```

### Filtering Notifications Programmatically

```javascript
// Show only likes
filterNotificationsByTab('likes')

// Show only mentions
filterNotificationsByTab('mentions')

// Show only comments
filterNotificationsByTab('comments')

// Show all
filterNotificationsByTab('all')
```

### Handling User Actions

```javascript
// When user clicks Like on notification at index 0
handleNotificationAction(0, 'like')

// When user clicks Reply
handleNotificationAction(0, 'reply')

// When user clicks Follow
handleNotificationAction(0, 'follow')

// When user clicks Dismiss
handleNotificationAction(0, 'dismiss')  // Removes notification
```

### Notification Object Structure

Each notification has this structure:

```javascript
{
  id: 1,                          // Unique identifier
  userName: "Ali Valiyev",        // Who triggered the notification
  action: "postingizga rahmasiz qo'ydi",  // What they did
  actionType: "Eng so'nggi postingizga yoqdi",  // Description
  category: "likes",              // Category: all, mentions, likes, comments
  time: "5 min",                  // When it happened
  unread: true,                   // Whether it's been read
  isNew: false,                   // For ping animation
  avatarImg: ""                   // Optional: image URL or emoji
}
```

### Real-Time Updates

The system automatically adds a new random notification every 40 seconds. To modify this:

```javascript
// In the initialization code (around line 2840)
// Change 40000 (milliseconds) to desired interval:
setInterval(() => {
  const msg = notificationMessages[notificationIndex % 5]
  addNotificationWithPing(msg.user, msg.action, msg.type, msg.cat, 'yangi')
  notificationIndex++
}, 30000)  // Change 40000 to 30000 for every 30 seconds
```

### Accessing Notifications

```javascript
// Get all notifications
state.notifications

// Get unread count
state.notifications.filter(n => n.unread).length

// Get notifications by category
state.notifications.filter(n => n.category === 'likes')

// Get first notification
state.notifications[0]

// Add custom notification to data
state.notifications.push(newNotificationObject)
saveState()  // Don't forget to save!
```

---

## Animation Details

### Slide-Down Animation
- **Duration**: 0.4 seconds
- **Easing**: cubic-bezier(0.34, 1.56, 0.64, 1) (overshoot effect)
- **Transforms**: translateY(-30px) + scale(0.95) → normal position

### Ping Animation (New Notifications)
- **Duration**: 0.5 seconds
- **Effect**: Scale pulse 1 → 1.15 with opacity fade
- **Easing**: ease-out
- **Applied to**: `.new-notification` class

### Hover Animations
- **Avatar scale**: 1 → 1.1x
- **Action buttons scale**: 1.2x on hover, 1.08x on click
- **Background transition**: 0.15s smooth color change
- **All transitions**: Use `var(--transition-fast)` (150ms)

---

## Color Reference

| Element | Color | Usage |
|---------|-------|-------|
| Panel Background | `var(--glass-bg)` | Semi-transparent with blur |
| Header | Gradient: #2563eb → #5b7dff | Blue gradient |
| Tab Border | #2563eb | Active tab underline |
| Like Action | #ef4444 | Red button gradient |
| Reply Action | #06b6d4 | Cyan button gradient |
| Follow Action | #10b981 | Green button gradient |
| Unread Badge | var(--danger) | Red notification count |
| Border | var(--border) | Light gray separator lines |
| Text Primary | var(--text-primary) | User names, main text |
| Text Secondary | var(--text-secondary) | Descriptions |
| Text Muted | var(--text-muted) | Times, hints |

---

## Responsive Design

### Desktop (>768px)
- Panel width: 420px (centered)
- Max height: 680px
- Action buttons hidden by default (reveal on hover)
- Avatar size: 48px
- Button size: 32px

### Tablet (768px)
- Panel: 100% width with padding
- Avatar size: 44px
- Button size: 28px
- Action buttons always visible

### Mobile (<480px)
- Full screen modal (100% × 100%, no border-radius)
- Action buttons always visible (touch-friendly)
- Avatar size: 40px
- Button size: 32px
- Scrollable tabs with touch acceleration

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Esc** | Close notifications panel |
| **Click outside** | Close settings dropdown |

---

## Troubleshooting

### Notifications not appearing?
1. Check if notification panel is open (`#notificationsModal.show`)
2. Verify notification object has required fields
3. Check browser console for JavaScript errors
4. Ensure `state.notifications` is being updated
5. Call `saveState()` after adding notifications

### Badges not updating?
1. Call `updateTabBadges()` after modifying notifications
2. Check that notification objects have `category` field
3. Verify `unread` field is boolean
4. Ensure UI elements have correct IDs (`badgeAll`, `badgeMentions`, etc.)

### Actions not working?
1. Check event listeners are attached (line 3090+)
2. Verify button HTML has `onclick="handleNotificationAction(...)"` 
3. Check browser console for errors
4. Ensure notification index is correct (0-based)

### Animations not smooth?
1. Ensure hardware acceleration is enabled
2. Check CSS `transform` and `opacity` are being used (not `left`/`top`)
3. Verify animation duration matches CSS keyframes
4. Test on modern browser (Chrome, Firefox, Safari, Edge)

### Settings not saving?
1. Check localStorage is enabled in browser
2. Verify `handleNotificationSettings()` is being called
3. Check browser console for storage errors
4. Clear browser cache and retry

---

## Performance Tips

1. **Limit notifications**: Keep state.notifications under 1000 items
2. **Batch updates**: Update multiple notifications before re-rendering
3. **Debounce filters**: If filtering frequently, debounce the callback
4. **Image optimization**: Use smaller avatar images (<50KB)
5. **Lazy load**: Load old notifications on scroll (future enhancement)

---

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | All features supported |
| Firefox | ✅ Full | All features supported |
| Safari | ✅ Full | All features supported |
| Edge | ✅ Full | All features supported |
| IE 11 | ⚠️ Partial | CSS variables not supported |
| Mobile Safari | ✅ Full | Touch optimized |
| Chrome Mobile | ✅ Full | Touch optimized |

---

## Files Modified

- **index.html**: Main application file
  - CSS: +450 lines (notifications styling)
  - HTML: Notifications modal structure enhanced
  - JavaScript: +500 lines (advanced functions)

- **NOTIFICATIONS_UPGRADE_SUMMARY.md**: Detailed documentation (this directory)

---

## Need Help?

Refer to:
1. **NOTIFICATIONS_UPGRADE_SUMMARY.md** - Complete technical documentation
2. **Code comments** - Inline CSS/JS comments explaining features
3. **Sample notifications** - Pre-loaded demo data showing structure
4. **Event listeners** - Line 3090+ shows all attachments

---

**Version**: 1.0  
**Status**: ✅ Production Ready  
**Last Updated**: Today  
**Tested On**: Desktop, Tablet, Mobile
