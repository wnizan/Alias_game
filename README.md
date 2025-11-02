# 🎮 Alias Game

משחק אליאס - משחק ניחוש מילים חברתי בזמן אמת

## 🚀 התקנה מהירה

### שלב 1: חלץ את ה-ZIP
```bash
unzip alias-game.zip
cd alias-game
```

### שלב 2: התקן
```bash
npm install
```

### שלב 3: הגדר .env.local
צור קובץ `.env.local`:
```env
VITE_SUPABASE_URL=https://your_project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### שלב 4: הרץ
```bash
npm run dev
```

המשחק זמין ב: http://localhost:5173

## 🎯 איך משחקים
1. בוחרים "משחק אונליין"
2. מישהו יוצר חדר, אחרים מצטרפים
3. כתבים שם וקבוצה
4. משחקים!

## 📚 קבצים
- `package.json` - Dependencies
- `index.html` - HTML
- `src/App.jsx` - הקומפוננטה הראשית
- `src/gameData.js` - מילים
- `src/supabaseClient.js` - חיבור ל-Supabase

## ⚠️ דרישות
- Node.js 16+
- Supabase account (חינמי)
- API Keys של Supabase

## 📞 עזרה
צלום מסך של השגיאה ותגיד לי!

---
© 2025 Nizan Waintraub