
https://www.profitablecpmratenetwork.com/kvys0irugy?key=bab5a6059b4023e35ab9f2133c436930
<script src="https://pl29195243.profitablecpmratenetwork.com/3a/e5/de/3ae5de541a80eb8cdbe4e7169880083f.js"></script>
<script async="async" data-cfasync="false" src="https://pl28547402.profitablecpmratenetwork.com/96c0e3d67ffd967d125cf1ceee43420a/invoke.js"></script>
<div id="container-96c0e3d67ffd967d125cf1ceee43420a"></div>


window.ads = (function () {
  var adFrequency = {
    levelStart: 3, // Show on every 3rd level start
    afterSubmit: 3, // Show after every 3 submits
    hint: 1, // Show on hint (second hint click)
    gameStart: 1 // Show on game start
  };

  var counters = {
    submits: 0,
    levels: 0
  };

  var adsterraLoaded = false;
  var hintClickCount = 0;

  function initAdsterra() {
    if (adsterraLoaded) return;
    // Adsterra scripts are already loaded in index.html
    adsterraLoaded = true;
    console.log("[Ads] Adsterra initialized");
  }

  function createAdContainer(id, isRewarded) {
    var existing = document.getElementById(id);
    if (existing) return existing;

    var overlay = document.createElement("div");
    overlay.id = id;
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
      backdrop-filter: blur(5px);
    `;

    var adContent = document.createElement("div");
    adContent.style.cssText = `
      max-width: 400px;
      width: 100%;
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      border: 1px solid rgba(48, 242, 255, 0.3);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      color: #e8efff;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    `;

    var title = document.createElement("h3");
    title.textContent = isRewarded ? "Watch Ad for Extra Hint" : "Advertisement";
    title.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 1.2rem;
      color: #30f2ff;
      font-weight: 600;
    `;

    var adContainer = document.createElement("div");
    adContainer.id = "adsterra-container-" + id;
    adContainer.style.cssText = `
      min-height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 16px 0;
      border: 1px dashed rgba(48, 242, 255, 0.2);
      border-radius: 12px;
      background: rgba(0,0,0,0.2);
    `;

    var closeButton = document.createElement("button");
    closeButton.id = "adsCloseButton";
    closeButton.textContent = isRewarded ? "Watch & Get Hint" : "Continue";
    closeButton.style.cssText = `
      margin-top: 16px;
      background: linear-gradient(135deg, #30f2ff, #8c52ff);
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      color: #00142c;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.9rem;
      transition: transform 0.2s ease;
    `;

    closeButton.onmouseover = function() { this.style.transform = "scale(1.05)"; };
    closeButton.onmouseout = function() { this.style.transform = "scale(1)"; };

    adContent.appendChild(title);
    adContent.appendChild(adContainer);
    adContent.appendChild(closeButton);
    overlay.appendChild(adContent);
    document.body.appendChild(overlay);

    return overlay;
  }

  function showInterstitial(reason) {
    console.log("[Ads] Showing Adsterra interstitial for:", reason);
    return new Promise(function (resolve) {
      initAdsterra();
      var overlay = createAdContainer("adsterra-interstitial", false);
      var adContainer = overlay.querySelector("#adsterra-container-adsterra-interstitial");

      // Load Adsterra interstitial ad
      adContainer.innerHTML = '<div id="container-96c0e3d67ffd967d125cf1ceee43420a"></div>';
      if (window.atAsyncOptions && window.atAsyncOptions.length > 0) {
        // Re-trigger Adsterra ad loading
        if (window.atAsyncOptions[0].scriptLoaded) {
          window.atAsyncOptions[0].scriptLoaded();
        }
      }

      overlay.style.display = "flex";

      var closeBtn = overlay.querySelector("#adsCloseButton");
      closeBtn.onclick = function() {
        overlay.style.display = "none";
        resolve();
      };

      // Auto-close after minimum display time
      setTimeout(function() {
        if (overlay.style.display !== "none") {
          closeBtn.click();
        }
      }, 5000);
    });
  }

  function showRewarded(reason) {
    console.log("[Ads] Showing Adsterra rewarded for:", reason);
    return new Promise(function (resolve, reject) {
      initAdsterra();
      var overlay = createAdContainer("adsterra-rewarded", true);
      var adContainer = overlay.querySelector("#adsterra-container-adsterra-rewarded");

      // Load Adsterra rewarded ad
      adContainer.innerHTML = '<div id="container-96c0e3d67ffd967d125cf1ceee43420a"></div>';
      if (window.atAsyncOptions && window.atAsyncOptions.length > 0) {
        // Re-trigger Adsterra ad loading
        if (window.atAsyncOptions[0].scriptLoaded) {
          window.atAsyncOptions[0].scriptLoaded();
        }
      }

      overlay.style.display = "flex";

      var closeBtn = overlay.querySelector("#adsCloseButton");
      var rewarded = false;

      closeBtn.onclick = function() {
        overlay.style.display = "none";
        if (rewarded) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      // Simulate reward after minimum watch time
      setTimeout(function() {
        rewarded = true;
        closeBtn.textContent = "Claim Hint";
        closeBtn.style.background = "linear-gradient(135deg, #31d47d, #30f2ff)";
      }, 3000);
    });
  }

  function shouldShowAd(type) {
    if (!adFrequency[type]) return false;
    if (type === 'afterSubmit') {
      counters.submits++;
      return counters.submits % adFrequency.afterSubmit === 0;
    }
    if (type === 'levelStart') {
      counters.levels++;
      return counters.levels % adFrequency.levelStart === 0;
    }
    if (type === 'hint') {
      hintClickCount++;
      return hintClickCount >= 2; // Show on second hint click
    }
    return Math.random() < 0.3; // 30% chance for other types
  }

  function resetHintCounter() {
    hintClickCount = 0;
  }

  return {
    showInterstitial: showInterstitial,
    showRewarded: showRewarded,
    shouldShowAd: shouldShowAd,
    resetHintCounter: resetHintCounter,
    config: {
      platform: "adsterra",
      frequency: adFrequency
    }
  };
})();
