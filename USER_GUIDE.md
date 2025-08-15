# 🎯 Which Documentation Should You Read?

Choose your path based on what you need:

## 🚀 **I Just Want to Use the API (Most Users)**

**Start here:** [**QUICK_REFERENCE.md**](./QUICK_REFERENCE.md) ⭐

This gives you:
- ✅ Working API calls in 30 seconds
- ✅ Timezone conversion examples
- ✅ Test case to verify your setup
- ✅ Common mistakes to avoid

**Perfect for:** Developers who want to integrate quickly and get accurate results.

---

## 📚 **I Need Complete Documentation**

**Read:** [**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md) 📖

This comprehensive guide includes:
- ✅ All API endpoints and parameters
- ✅ Detailed timezone handling
- ✅ Programming examples (JavaScript, Python)
- ✅ Troubleshooting section
- ✅ Advanced use cases

**Perfect for:** Developers building complex applications, need full reference, or troubleshooting issues.

---

## ⚡ **I Just Want One Working Example**

**Copy this command and modify it:**

```bash
# For Vedic/Sidereal astrology - CONVERT YOUR LOCAL TIME TO UTC FIRST
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=YYYY-MM-DDTHH:MM:SSZ&lat=YOUR_LAT&lon=YOUR_LON&tropical=false"

# Example: Birth Sep 30, 2000, 12:00 PM in Kolkata (UTC+5:30)
curl "https://swiss-ephemeris-engine.onrender.com/v1/houses?datetime=2000-09-30T06:30:00Z&lat=22.5726459&lon=88.3638953&tropical=false"
# Returns: Sagittarius ascendant ✅
```

**⚠️ CRITICAL:** Convert your local birth time to UTC or you'll get the wrong ascendant!

---

## 🔧 **I Want to Set Up/Deploy the Engine**

**Read:** [**README.md**](./README.md) (Installation & Setup sections) 🛠️

This covers:
- ✅ Installation instructions
- ✅ Running the API service locally
- ✅ Docker deployment
- ✅ Ephemeris file setup

**Perfect for:** System administrators, DevOps, or developers running their own instance.

---

## 🆘 **I'm Getting Wrong Results**

**Quick checklist:**

1. **❌ Wrong ascendant sign?** → You probably have a timezone issue
   - **Solution:** Convert your birth time to UTC before calling the API
   - **Help:** See timezone examples in [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

2. **❌ API returning errors?** → Check your datetime format
   - **Solution:** Use ISO 8601 format: `2000-09-30T06:30:00Z`
   - **Help:** See troubleshooting in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md#troubleshooting)

3. **❌ Still stuck?** → Read the full troubleshooting guide
   - **Help:** [API_DOCUMENTATION.md - Troubleshooting Section](./API_DOCUMENTATION.md#troubleshooting)

---

## 🎓 **Reading Order for New Users**

**Recommended path:**

1. **Start:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) (5 min read)
2. **Test:** Try the example API call with your birth data
3. **If needed:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details
4. **If deploying:** [README.md](./README.md) for setup instructions

---

## 📊 **Document Summary**

| Document | Best For | Reading Time | Purpose |
|----------|----------|--------------|---------|
| [**QUICK_REFERENCE.md**](./QUICK_REFERENCE.md) | Most developers | 5 minutes | Get working API calls fast |
| [**API_DOCUMENTATION.md**](./API_DOCUMENTATION.md) | Complete reference | 20 minutes | Full API guide with examples |
| [**README.md**](./README.md) | Setup/deployment | 10 minutes | Installation and project overview |
| [**USER_GUIDE.md**](./USER_GUIDE.md) | First-time visitors | 2 minutes | This navigation guide |

---

## 💡 **Pro Tip**

**For 95% of users:** Start with [QUICK_REFERENCE.md](./QUICK_REFERENCE.md). It has everything you need to get accurate astrology calculations in minutes.

**The most important thing:** Make sure you convert local birth time to UTC, or your ascendant calculations will be wrong! 🕐

---

*Happy calculating! 🌟*
