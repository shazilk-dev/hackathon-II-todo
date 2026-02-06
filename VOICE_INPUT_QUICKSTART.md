# Voice Input - Quick Start Guide

## 🎤 What's New?

Your chat interface now supports **voice input** powered by ChatKit and Web Speech API!

## 🚀 Quick Test (30 seconds)

1. **Start the app:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python -m uvicorn src.main:app --reload

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Open chat page:**
   - Navigate to `http://localhost:3000/auth/sign-in`
   - Sign in with your account
   - Go to Chat page

3. **Try voice input:**
   - Look for the microphone button (gray circle)
   - Click it → button turns **red and pulses**
   - Say: **"Show me all my tasks"**
   - Watch text appear in input field
   - Press Enter or click Send

## 🎯 Voice Commands to Try

```
✅ "Show me all my tasks"
✅ "Add a new task called buy groceries"
✅ "Mark task 1 as complete"
✅ "What tasks are still pending?"
✅ "Delete the last task"
```

## 🌐 Browser Requirements

**Best Support:**
- ✅ Chrome (Desktop & Android)
- ✅ Safari (Desktop & iOS 14.5+)
- ✅ Edge (Windows)

**Limited:**
- ⚠️ Firefox (requires flag: `media.webspeech.recognition.enable`)

## 🎨 UI Features

### Custom Input Bar
```
┌──────────────────────────────────────┐
│  [Type or speak...]  [🎤]  [➤]      │
└──────────────────────────────────────┘
```

### Button States

**Mic Button:**
- 🔘 **Gray** = Ready (click to start)
- 🔴 **Red + Pulse** = Recording (speak now!)
- ❌ **Disabled** = Sending message

**Send Button:**
- 🔵 **Blue** = Ready to send
- 🔄 **Spinning** = Sending message
- 🚫 **Grayed out** = Input empty

## 🐛 Troubleshooting

### "No microphone button?"

**Check:**
1. Browser compatibility (use Chrome/Safari)
2. HTTPS in production (localhost OK for testing)
3. Microphone permissions (browser will prompt)

### "Recording but no text?"

**Solutions:**
1. Speak clearly and pause naturally
2. Check microphone in system settings
3. Try refreshing the page
4. Check browser console for errors

### "ChatKit not loading?"

**Verify:**
```bash
# 1. Check ChatKit is installed
npm list @openai/chatkit-react
# Should show: @openai/chatkit-react@1.4.3

# 2. Check backend endpoint
curl -X POST http://localhost:8000/api/chatkit/session \
  -H "Authorization: Bearer <your-jwt-token>"

# 3. Check environment variables
cat frontend/.env.local
# Should have: NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📁 What Changed?

**New Files:**
- `frontend/components/chat/VoiceChatInterface.tsx` - Voice-enabled chat component

**Modified Files:**
- `frontend/app/chat/page.tsx` - Now uses VoiceChatInterface

**Existing (Unchanged):**
- `frontend/lib/api/chatkit.ts` - ChatKit API client
- `backend/src/api/routers/chatkit_session.py` - Session endpoint

## 🔧 Technical Details

**Voice Recognition:**
- Uses **Web Speech API** (built into browser)
- No external libraries needed
- Audio processed locally (privacy-safe)

**ChatKit Integration:**
- Message display handled by `@openai/chatkit-react`
- Custom input bar replaces default ChatKit input
- Thread persistence in localStorage

**Architecture:**
```
User Voice → Web Speech API → Text Input
                                    ↓
                              ChatKit Control
                                    ↓
                            Backend /chatkit
                                    ↓
                           OpenAI Agents SDK
                                    ↓
                            Tool Calls (add_task, etc.)
```

## 📚 Full Documentation

For detailed implementation guide, see: `VOICE_INPUT_GUIDE.md`

## 🎉 That's It!

You now have a fully functional voice-enabled chat interface. Try asking your assistant to manage tasks using your voice!

---

**Need Help?**
- Check `VOICE_INPUT_GUIDE.md` for detailed troubleshooting
- Review browser console for error messages
- Verify backend logs for API issues
