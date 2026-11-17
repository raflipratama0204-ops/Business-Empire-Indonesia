// Business Empire: RichMan - Investment System Module (Stocks, Crypto, Real Estate, Luxury)
Object.assign(GameEngine.prototype, {
  setStockView(view) {
    this.stockView = view;
    window.sound.playClick();
    const port = document.getElementById('stocks-view-portfolio');
    const mkt = document.getElementById('stocks-view-market');
    if (port && mkt) {
      if (view === 'portfolio') {
        port.classList.remove('hidden');
        port.classList.remove('view-transition');
        void port.offsetWidth;
        port.classList.add('view-transition');
        mkt.classList.add('hidden');
      } else {
        port.classList.add('hidden');
        mkt.classList.remove('hidden');
        mkt.classList.remove('view-transition');
        void mkt.offsetWidth;
        mkt.classList.add('view-transition');
      }
    }
    this.renderStockList();
  },

  setCryptoView(view) {
    this.cryptoView = view;
    window.sound.playClick();
    const port = document.getElementById('crypto-view-portfolio');
    const mkt = document.getElementById('crypto-view-market');
    if (port && mkt) {
      if (view === 'portfolio') {
        port.classList.remove('hidden');
        port.classList.remove('view-transition');
        void port.offsetWidth;
        port.classList.add('view-transition');
        mkt.classList.add('hidden');
      } else {
        port.classList.add('hidden');
        mkt.classList.remove('hidden');
        mkt.classList.remove('view-transition');
        void mkt.offsetWidth;
        mkt.classList.add('view-transition');
      }
    }
    this.renderCryptoList();
  },

  setPropertyView(view) {
    this.propertyView = view;
    window.sound.playClick();
    const port = document.getElementById('property-view-portfolio');
    const cat = document.getElementById('property-view-catalog');
    if (port && cat) {
      if (view === 'portfolio') {
        port.classList.remove('hidden');
        port.classList.remove('view-transition');
        void port.offsetWidth;
        port.classList.add('view-transition');
        cat.classList.add('hidden');
      } else {
        port.classList.add('hidden');
        cat.classList.remove('hidden');
        cat.classList.remove('view-transition');
        void cat.offsetWidth;
        cat.classList.add('view-transition');
      }
    }
    this.renderRealEstate();
  },

  setLuxuryView(view) {
    this.luxuryView = view;
    window.sound.playClick();
    const owned = document.getElementById('luxury-view-owned');
    const cat = document.getElementById('luxury-view-catalog');
    if (owned && cat) {
      if (view === 'owned') {
        owned.classList.remove('hidden');
        owned.classList.remove('view-transition');
        void owned.offsetWidth;
        owned.classList.add('view-transition');
        cat.classList.add('hidden');
      } else {
        owned.classList.add('hidden');
        cat.classList.remove('hidden');
        cat.classList.remove('view-transition');
        void cat.offsetWidth;
        cat.classList.add('view-transition');
      }
    }
    this.renderLuxury();
  },

  switchInvestSubTab(subTab) {
    this.investSubTab = subTab;
    window.sound.playClick();

    ['stocks', 'crypto', 'commodity', 'property'].forEach(tab => {
      const btn = document.getElementById(`invest-sub-btn-${tab}`);
      const sec = document.getElementById(`invest-${tab}-sec`);
      if (btn) {
        if (tab === subTab) {
          btn.className = 'flex-1 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-xs shadow transition';
        } else {
          btn.className = 'flex-1 py-1.5 rounded-lg text-slate-400 hover:text-white font-semibold text-xs transition';
        }
      }
      if (sec) {
        if (tab === subTab) {
          sec.classList.remove('hidden');
        } else {
          sec.classList.add('hidden');
        }
      }
    });

    this.renderInvestments();
  },

  setRealEstateFilter(filter) {
    this.realEstateFilter = filter;
    window.sound.playClick();
    this.renderRealEstate();
  },

  setLuxuryFilter(filter) {
    this.luxuryFilter = filter;
    window.sound.playClick();
    this.renderLuxury();
  },

  getPropertyData(id) {
    let p = this.state.properties[id];
    if (!p) {
      this.state.properties[id] = { count: 0, furnished: false, internet: false, condition: 100 };
      return this.state.properties[id];
    }
    if (typeof p === 'number') {
      this.state.properties[id] = { count: p, furnished: false, internet: false, condition: 100 };
      return this.state.properties[id];
    }
    if (p.condition === undefined) p.condition = 100;
    if (p.furnished === undefined) p.furnished = false;
    if (p.internet === undefined) p.internet = false;
    if (p.count === undefined) p.count = 0;
    return p;
  },

  buyProperty(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    if (!prop) return;

    const pData = this.getPropertyData(id);
    if (pData.count >= 1) {
      window.sound.playClick();
      this.showToast(`Properti ${prop.name} sudah Anda miliki! Setiap unit properti bersifat eksklusif (1 unit per aset).`, 'warning');
      return;
    }

    if (this.state.cash < prop.price) {
      window.sound.playError();
      this.showToast('Uang tunai tidak cukup untuk membeli properti ini!', 'error');
      return;
    }

    this.state.cash -= prop.price;
    pData.count = 1;
    pData.condition = 100;
    pData.furnished = false;
    pData.internet = false;
    window.sound.playUpgrade();
    this.showToast(`Selamat! Anda resmi memiliki ${prop.name}! Properti telah dipindahkan ke portofolio Anda.`, 'success');
    this.saveGame();
    this.render();
  },

  buyPropertyFurniture(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    const pData = this.getPropertyData(id);
    if (!prop || pData.count <= 0) return;

    if (pData.furnished) {
      this.showToast('Tempat tidur dan perabot furnitur sudah terpasang lengkap!', 'info');
      return;
    }

    const totalCost = prop.furnitureCost * pData.count;
    if (this.state.cash < totalCost) {
      window.sound.playError();
      this.showToast(`Uang tidak cukup untuk pembelian perabot & kasur! Butuh ${this.formatCompact(totalCost)}`, 'error');
      return;
    }

    this.state.cash -= totalCost;
    pData.furnished = true;
    window.sound.playUpgrade();
    this.showToast(`Tempat tidur & furnitur lengkap dipasang di unit ${prop.name}! (+25% Pendapatan Sewa)`, 'success');
    this.saveGame();
    this.render();
  },

  buyPropertyInternet(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    const pData = this.getPropertyData(id);
    if (!prop || pData.count <= 0) return;

    if (pData.internet) {
      this.showToast('Jaringan WiFi internet cepat sudah terpasang!', 'info');
      return;
    }

    const totalCost = prop.internetCost * pData.count;
    if (this.state.cash < totalCost) {
      window.sound.playError();
      this.showToast(`Uang tidak cukup untuk pasang internet! Butuh ${this.formatCompact(totalCost)}`, 'error');
      return;
    }

    this.state.cash -= totalCost;
    pData.internet = true;
    window.sound.playUpgrade();
    this.showToast(`Pemasangan internet cepat fiber optik selesai di unit ${prop.name}! (+15% Pendapatan Sewa)`, 'success');
    this.saveGame();
    this.render();
  },

  serviceProperty(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    const pData = this.getPropertyData(id);
    if (!prop || pData.count <= 0) return;

    if (pData.condition >= 100) {
      this.showToast('Kondisi properti masih prima 100%, belum butuh servis perbaikan.', 'info');
      return;
    }

    const serviceCost = Math.round(prop.price * 0.03 * pData.count * ((100 - pData.condition) / 100)) + 500000;
    if (this.state.cash < serviceCost) {
      window.sound.playError();
      this.showToast(`Uang tidak cukup untuk biaya perbaikan! Butuh ${this.formatCompact(serviceCost)}`, 'error');
      return;
    }

    this.state.cash -= serviceCost;
    pData.condition = 100;
    window.sound.playUpgrade();
    this.showToast(`Servis dan perbaikan selesai! Kondisi ${prop.name} kembali 100% prima.`, 'success');
    this.saveGame();
    this.render();
  },

  sellProperty(id) {
    const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
    const pData = this.getPropertyData(id);
    if (!prop || pData.count <= 0) return;

    const sellPrice = Math.round(prop.price * 0.9);
    pData.count -= 1;
    if (pData.count === 0) {
      pData.furnished = false;
      pData.internet = false;
      pData.condition = 100;
    }
    this.state.cash += sellPrice;
    window.sound.playCash();
    this.showToast(`1 unit ${prop.name} berhasil dijual seharga ${this.formatCompact(sellPrice)}!`, 'info');
    this.saveGame();
    this.render();
  },

  buyLuxury(id) {
    const lux = LUXURY_CATALOG.find(x => x.id === id);
    if (!lux) return;

    if (this.state.luxury.includes(id)) {
      this.showToast('Barang mewah ini sudah Anda miliki dalam koleksi!', 'info');
      return;
    }

    if (this.state.cash < lux.price) {
      window.sound.playError();
      this.showToast('Uang tunai belum cukup untuk barang bergengsi ini!', 'error');
      return;
    }

    this.state.cash -= lux.price;
    this.state.luxury.push(id);
    window.sound.playUpgrade();
    this.showToast(`Koleksi Baru! ${lux.name} telah masuk ke garasi/koleksi Anda!`, 'success');
    this.saveGame();
    this.render();
  },

  sellLuxury(id) {
    const idx = (this.state.luxury || []).indexOf(id);
    if (idx === -1) return;
    const lux = LUXURY_CATALOG.find(x => x.id === id);
    if (!lux) return;

    const sellPrice = Math.round(lux.price * 0.75);
    this.state.luxury.splice(idx, 1);
    this.state.cash += sellPrice;
    window.sound.playCash();
    this.showToast(`Berhasil menjual ${lux.name} seharga ${this.formatCompact(sellPrice)}!`, 'info');
    this.saveGame();
    this.render();
  },

  buyStock(symbol, shares) {
    const price = this.stockPrices[symbol];
    if (!price || shares <= 0) return;
    const totalCost = price * shares;
    if (this.state.cash < totalCost) {
      window.sound.playError();
      this.showToast('Uang tunai tidak cukup untuk membeli saham ini!', 'error');
      return;
    }

    this.state.cash -= totalCost;
    if (!this.state.stocks[symbol]) {
      this.state.stocks[symbol] = { shares: 0, totalCost: 0 };
    }
    this.state.stocks[symbol].shares += shares;
    this.state.stocks[symbol].totalCost += totalCost;

    window.sound.playCash();
    this.showToast(`Membeli ${shares.toLocaleString()} lembar ${symbol} seharga ${this.formatCompact(totalCost)}`, 'success');
    this.saveGame();
    this.render();
  },

  sellStock(symbol, shares) {
    const price = this.stockPrices[symbol];
    const userStock = this.state.stocks[symbol];
    if (!price || !userStock || userStock.shares < shares || shares <= 0) {
      window.sound.playError();
      this.showToast('Jumlah lembar saham tidak mencukupi untuk dijual!', 'error');
      return;
    }

    const totalRevenue = price * shares;
    const avgCostPerShare = userStock.shares > 0 ? (userStock.totalCost / userStock.shares) : 0;
    const costBasis = Math.round(avgCostPerShare * shares);
    const profit = Math.round(totalRevenue - costBasis);

    userStock.shares -= shares;
    userStock.totalCost = Math.max(0, userStock.totalCost - costBasis);
    this.state.cash += totalRevenue;

    // Catat akumulasi keuntungan trading saham
    if (!this.state.stats) {
      this.state.stats = { stockTradingProfit: 0, cryptoTradingProfit: 0, dividendsEarned: 0, businessEarnings: 0, rentalEarnings: 0 };
    }
    this.state.stats.stockTradingProfit = (this.state.stats.stockTradingProfit || 0) + profit;

    window.sound.playCash();
    const profitSign = profit >= 0 ? '+' : '-';
    this.showToast(`Menjual ${shares.toLocaleString()} lembar ${symbol} seharga ${this.formatCompact(totalRevenue)} (Profit: ${profitSign}${this.formatCompact(Math.abs(profit))})`, 'info');
    this.saveGame();
    this.render();
  },

  buyCrypto(symbol, spendCash) {
    const price = this.cryptoPrices[symbol];
    if (!price || spendCash <= 0) return;
    if (this.state.cash < spendCash) {
      window.sound.playError();
      this.showToast('Uang tunai tidak mencukupi!', 'error');
      return;
    }

    const amount = spendCash / price;
    this.state.cash -= spendCash;
    if (!this.state.crypto[symbol]) {
      this.state.crypto[symbol] = { amount: 0, totalCost: 0 };
    }
    this.state.crypto[symbol].amount += amount;
    this.state.crypto[symbol].totalCost += spendCash;

    window.sound.playCash();
    this.showToast(`Membeli ${amount.toFixed(4)} ${symbol} seharga ${this.formatCompact(spendCash)}`, 'success');
    this.saveGame();
    this.render();
  },

  sellCrypto(symbol, fraction) {
    const price = this.cryptoPrices[symbol];
    const userCrypto = this.state.crypto[symbol];
    if (!price || !userCrypto || userCrypto.amount <= 0.00001) {
      window.sound.playError();
      this.showToast('Saldo koin kripto Anda kosong!', 'error');
      return;
    }

    const isFullSell = fraction >= 0.99999;
    const amountToSell = isFullSell ? userCrypto.amount : userCrypto.amount * fraction;
    const totalRevenue = amountToSell * price;
    const costBasis = isFullSell ? userCrypto.totalCost : Math.round(userCrypto.totalCost * fraction);
    const profit = Math.round(totalRevenue - costBasis);

    if (isFullSell || (userCrypto.amount - amountToSell) <= 0.00001) {
      userCrypto.amount = 0;
      userCrypto.totalCost = 0;
    } else {
      userCrypto.amount -= amountToSell;
      userCrypto.totalCost = Math.max(0, userCrypto.totalCost - costBasis);
    }
    this.state.cash += totalRevenue;

    // Catat akumulasi keuntungan trading kripto
    if (!this.state.stats) {
      this.state.stats = { stockTradingProfit: 0, cryptoTradingProfit: 0, dividendsEarned: 0, businessEarnings: 0, rentalEarnings: 0 };
    }
    this.state.stats.cryptoTradingProfit = (this.state.stats.cryptoTradingProfit || 0) + profit;

    window.sound.playCash();
    const profitSign = profit >= 0 ? '+' : '-';
    this.showToast(`Menjual ${amountToSell.toFixed(4)} ${symbol} seharga ${this.formatCompact(totalRevenue)} (Profit: ${profitSign}${this.formatCompact(Math.abs(profit))})`, 'info');
    this.saveGame();
    this.render();
  },

  simulateMarketTick(forceLargeChange = false) {
    STOCKS_CATALOG.forEach(stock => {
      const vol = stock.volatility * (forceLargeChange ? 2.5 : 1);
      const deltaPercent = (Math.random() - 0.495) * vol;
      let newPrice = Math.round(this.stockPrices[stock.symbol] * (1 + deltaPercent));
      newPrice = Math.max(Math.round(stock.basePrice * 0.25), Math.min(newPrice, stock.basePrice * 5));
      this.stockPrices[stock.symbol] = newPrice;

      const history = this.stockHistories[stock.symbol];
      history.push(newPrice);
      if (history.length > 20) history.shift();
    });

    CRYPTO_CATALOG.forEach(coin => {
      const vol = coin.volatility * (forceLargeChange ? 2.5 : 1);
      const deltaPercent = (Math.random() - 0.49) * vol;
      let newPrice = Math.round(this.cryptoPrices[coin.symbol] * (1 + deltaPercent));
      newPrice = Math.max(Math.round(coin.basePrice * 0.1), Math.min(newPrice, coin.basePrice * 10));
      this.cryptoPrices[coin.symbol] = newPrice;

      const history = this.cryptoHistories[coin.symbol];
      history.push(newPrice);
      if (history.length > 20) history.shift();
    });

    if (typeof COMMODITIES_CATALOG !== 'undefined') {
      COMMODITIES_CATALOG.forEach(comm => {
        const vol = comm.volatility * (forceLargeChange ? 2.5 : 1);
        const deltaPercent = (Math.random() - 0.495) * vol;
        let newPrice = Math.round((this.commodityPrices[comm.symbol] || comm.basePrice) * (1 + deltaPercent));
        newPrice = Math.max(Math.round(comm.basePrice * 0.2), Math.min(newPrice, comm.basePrice * 6));
        this.commodityPrices[comm.symbol] = newPrice;

        if (!this.commodityHistories[comm.symbol]) {
          this.commodityHistories[comm.symbol] = [newPrice];
        } else {
          const history = this.commodityHistories[comm.symbol];
          history.push(newPrice);
          if (history.length > 20) history.shift();
        }
      });
    }

    // Cek Likuidasi Posisi Komoditas Aktif (-98% margin loss)
    if (Array.isArray(this.state.commodityPositions) && this.state.commodityPositions.length > 0) {
      let liquidated = 0;
      this.state.commodityPositions = this.state.commodityPositions.filter(pos => {
        const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
        const priceChange = (curPrice - pos.entryPrice) / pos.entryPrice;
        const pnlRate = (pos.type === 'LONG' ? priceChange : -priceChange) * (pos.leverage || 1);
        if (pnlRate <= -0.98) {
          liquidated++;
          return false;
        }
        return true;
      });
      if (liquidated > 0) {
        window.sound.playError();
        this.showToast(`🚨 PERINGATAN MARGIN CALL: ${liquidated} kontrak trading komoditas Anda terlikuidasi otomatis (rugi 100%) akibat pergerakan pasar tajam!`, 'error');
        this.saveGame();
        this.render();
      }
    }
  },

  // ------------------------------------------
  // TRADING SAHAM DENGAN INPUT CUSTOM
  // ------------------------------------------
  openStockModal(symbol) {
    this.stockDetailSymbol = symbol;
    const stock = STOCKS_CATALOG.find(x => x.symbol === symbol);
    const userHold = this.state.stocks[symbol] || { shares: 0, totalCost: 0 };
    const price = this.stockPrices[symbol];

    const modal = document.getElementById('stock-modal');
    if (!modal) return;

    document.getElementById('stock-modal-title').innerText = `${stock.icon} ${stock.name} (${stock.symbol})`;
    document.getElementById('stock-modal-price').innerText = this.formatMoney(price);
    document.getElementById('stock-modal-owned').innerText = `${userHold.shares.toLocaleString()} Lembar (${this.formatCompact(userHold.shares * price)})`;
    document.getElementById('stock-modal-dividend').innerText = `+${(stock.dividendYieldHourly * 100).toFixed(2)}%/jam`;

    // Maksimal lembar saham yang mampu dibeli dari saldo kas tunai
    const maxBuy = price > 0 ? Math.floor(this.state.cash / price) : 0;
    const maxBuyEl = document.getElementById('stock-modal-max-buy');
    if (maxBuyEl) maxBuyEl.innerText = `${maxBuy.toLocaleString()} Lembar (${this.formatCompact(maxBuy * price)})`;

    // Reset input form
    const buyInput = document.getElementById('stock-buy-input');
    if (buyInput) buyInput.value = '';
    const sellInput = document.getElementById('stock-sell-input');
    if (sellInput) sellInput.value = '';
    this.onStockBuyInputChange('');
    this.onStockSellInputChange('');

    modal.classList.remove('hidden');
  },

  closeStockModal() {
    const modal = document.getElementById('stock-modal');
    if (modal) modal.classList.add('hidden');
  },

  onStockBuyInputChange(val) {
    const shares = parseInt(val) || 0;
    const price = (this.stockPrices && this.stockPrices[this.stockDetailSymbol]) || 0;
    const cost = shares * price;
    const preview = document.getElementById('stock-buy-preview');
    if (preview) preview.innerText = `Estimasi: ${this.formatMoney(cost)}`;
  },

  setStockBuyInput(shares) {
    const price = (this.stockPrices && this.stockPrices[this.stockDetailSymbol]) || 1;
    if (shares === 'max') {
      shares = Math.floor(this.state.cash / price);
    }
    const input = document.getElementById('stock-buy-input');
    if (input) input.value = shares > 0 ? shares : '';
    this.onStockBuyInputChange(shares);
  },

  buyStockCustom() {
    const input = document.getElementById('stock-buy-input');
    const shares = parseInt(input ? input.value : 0) || 0;
    if (shares <= 0) {
      window.sound.playError();
      this.showToast('Ketik jumlah lembar saham yang ingin dibeli terlebih dahulu!', 'error');
      return;
    }
    this.buyStock(this.stockDetailSymbol, shares);
    this.openStockModal(this.stockDetailSymbol);
  },

  onStockSellInputChange(val) {
    const shares = parseInt(val) || 0;
    const price = (this.stockPrices && this.stockPrices[this.stockDetailSymbol]) || 0;
    const revenue = shares * price;
    const preview = document.getElementById('stock-sell-preview');
    if (preview) preview.innerText = `Estimasi: ${this.formatMoney(revenue)}`;
  },

  setStockSellInput(shares) {
    const userHold = this.state.stocks[this.stockDetailSymbol] || { shares: 0 };
    if (shares === 'all') {
      shares = userHold.shares;
    }
    const input = document.getElementById('stock-sell-input');
    if (input) input.value = shares > 0 ? shares : '';
    this.onStockSellInputChange(shares);
  },

  sellStockCustom() {
    const input = document.getElementById('stock-sell-input');
    const shares = parseInt(input ? input.value : 0) || 0;
    if (shares <= 0) {
      window.sound.playError();
      this.showToast('Ketik jumlah lembar saham yang ingin dijual terlebih dahulu!', 'error');
      return;
    }
    this.sellStock(this.stockDetailSymbol, shares);
    this.openStockModal(this.stockDetailSymbol);
  },

  buyStockQuick(shares) {
    if (shares === 'max') {
      const price = this.stockPrices[this.stockDetailSymbol];
      shares = Math.floor(this.state.cash / price);
    }
    this.buyStock(this.stockDetailSymbol, parseInt(shares));
    this.openStockModal(this.stockDetailSymbol);
  },

  sellStockQuick(shares) {
    const userHold = this.state.stocks[this.stockDetailSymbol] || { shares: 0 };
    if (shares === 'max') {
      shares = userHold.shares;
    }
    this.sellStock(this.stockDetailSymbol, parseInt(shares));
    this.openStockModal(this.stockDetailSymbol);
  },

  // ------------------------------------------
  // TRADING KRIPTO DENGAN INPUT CUSTOM
  // ------------------------------------------
  openCryptoModal(symbol) {
    this.cryptoDetailSymbol = symbol;
    const coin = CRYPTO_CATALOG.find(x => x.symbol === symbol);
    const userHold = this.state.crypto[symbol] || { amount: 0, totalCost: 0 };
    const price = this.cryptoPrices[symbol];

    const modal = document.getElementById('crypto-modal');
    if (!modal) return;

    document.getElementById('crypto-modal-title').innerText = `${coin.icon} ${coin.name} (${coin.symbol})`;
    document.getElementById('crypto-modal-price').innerText = this.formatMoney(price);
    const displayAmount = userHold.amount > 0.00001 ? userHold.amount : 0;
    document.getElementById('crypto-modal-owned').innerText = `${displayAmount.toFixed(4)} ${coin.symbol} (${this.formatCompact(displayAmount * price)})`;

    // Maksimal koin kripto yang mampu dibeli dari saldo kas tunai
    const maxBuy = price > 0 ? (this.state.cash / price) : 0;
    const maxBuyEl = document.getElementById('crypto-modal-max-buy');
    if (maxBuyEl) maxBuyEl.innerText = `${maxBuy.toFixed(4)} ${coin.symbol} (${this.formatCompact(this.state.cash)})`;

    // Reset input form
    const buyInput = document.getElementById('crypto-buy-input');
    if (buyInput) buyInput.value = '';
    const sellInput = document.getElementById('crypto-sell-input');
    if (sellInput) sellInput.value = '';
    this.onCryptoBuyInputChange('');
    this.onCryptoSellInputChange('');

    modal.classList.remove('hidden');
  },

  closeCryptoModal() {
    const modal = document.getElementById('crypto-modal');
    if (modal) modal.classList.add('hidden');
  },

  onCryptoBuyInputChange(val) {
    const amount = parseFloat(val) || 0;
    const price = (this.cryptoPrices && this.cryptoPrices[this.cryptoDetailSymbol]) || 0;
    const cost = Math.round(amount * price);
    const preview = document.getElementById('crypto-buy-preview');
    if (preview) preview.innerText = `Estimasi: ${this.formatMoney(cost)}`;
  },

  setCryptoBuyPercent(percent) {
    const price = (this.cryptoPrices && this.cryptoPrices[this.cryptoDetailSymbol]) || 1;
    const spend = this.state.cash * (percent / 100);
    const amount = spend / price;
    const input = document.getElementById('crypto-buy-input');
    if (input) input.value = amount > 0 ? (amount < 0.0001 ? Number(amount.toFixed(8)).toString() : Number(amount.toFixed(4)).toString()) : '';
    this.onCryptoBuyInputChange(input ? input.value : 0);
  },

  buyCryptoCustom() {
    const input = document.getElementById('crypto-buy-input');
    const amount = parseFloat(input ? input.value : 0) || 0;
    if (amount <= 0) {
      window.sound.playError();
      this.showToast('Ketik jumlah koin kripto yang ingin dibeli terlebih dahulu!', 'error');
      return;
    }
    const price = (this.cryptoPrices && this.cryptoPrices[this.cryptoDetailSymbol]) || 0;
    const spendCash = Math.round(amount * price);
    this.buyCrypto(this.cryptoDetailSymbol, spendCash);
    this.openCryptoModal(this.cryptoDetailSymbol);
  },

  onCryptoSellInputChange(val) {
    const amount = parseFloat(val) || 0;
    const price = (this.cryptoPrices && this.cryptoPrices[this.cryptoDetailSymbol]) || 0;
    const revenue = Math.round(amount * price);
    const preview = document.getElementById('crypto-sell-preview');
    if (preview) preview.innerText = `Estimasi: ${this.formatMoney(revenue)}`;
  },

  setCryptoSellPercent(percent) {
    const userHold = this.state.crypto[this.cryptoDetailSymbol] || { amount: 0 };
    if (userHold.amount <= 0.00001) return;
    const input = document.getElementById('crypto-sell-input');
    if (!input) return;
    if (percent >= 100) {
      input.value = Number(userHold.amount.toFixed(8)).toString();
    } else {
      const amount = userHold.amount * (percent / 100);
      input.value = amount > 0 ? Number(amount.toFixed(8)).toString() : '';
    }
    this.onCryptoSellInputChange(input.value);
  },

  sellCryptoCustom() {
    const input = document.getElementById('crypto-sell-input');
    const amount = parseFloat(input ? input.value : 0) || 0;
    const userHold = this.state.crypto[this.cryptoDetailSymbol] || { amount: 0 };
    if (amount <= 0 || userHold.amount <= 0.00001) {
      window.sound.playError();
      this.showToast('Ketik jumlah koin kripto yang ingin dijual terlebih dahulu!', 'error');
      return;
    }
    // Jika jumlah jual sama dengan atau melebihi saldo koin (atau selisih mikroskopis), jual 100%
    const isSellAll = amount >= userHold.amount || Math.abs(amount - userHold.amount) <= 0.00005;
    const fraction = isSellAll ? 1.0 : Math.min(1.0, amount / userHold.amount);
    this.sellCrypto(this.cryptoDetailSymbol, fraction);
    const rem = this.state.crypto[this.cryptoDetailSymbol];
    if (!rem || rem.amount <= 0.00001) {
      this.closeCryptoModal();
    } else {
      this.openCryptoModal(this.cryptoDetailSymbol);
    }
  },

  buyCryptoPercent(percent) {
    const spend = this.state.cash * (percent / 100);
    this.buyCrypto(this.cryptoDetailSymbol, spend);
    this.openCryptoModal(this.cryptoDetailSymbol);
  },

  sellCryptoPercent(percent) {
    this.sellCrypto(this.cryptoDetailSymbol, percent / 100);
    const rem = this.state.crypto[this.cryptoDetailSymbol];
    if (!rem || rem.amount <= 0.00001) {
      this.closeCryptoModal();
    } else {
      this.openCryptoModal(this.cryptoDetailSymbol);
    }
  },

  // ------------------------------------------
  // TRADING KOMODITAS (LONG / SHORT DENGAN LEVERAGE)
  // ------------------------------------------
  openCommodityModal(symbol, type = 'LONG') {
    this.commodityDetailSymbol = symbol;
    this.commodityOrderType = type;
    this.commodityOrderLeverage = this.commodityOrderLeverage || 5;

    const comm = (typeof COMMODITIES_CATALOG !== 'undefined' ? COMMODITIES_CATALOG : []).find(x => x.symbol === symbol);
    if (!comm) return;
    const price = (this.commodityPrices && this.commodityPrices[symbol]) || comm.basePrice;

    const modal = document.getElementById('commodity-modal');
    if (!modal) return;

    document.getElementById('commodity-modal-title').innerText = `${comm.icon} Kontrak ${comm.name} (${comm.symbol})`;
    document.getElementById('commodity-modal-price').innerText = `${this.formatMoney(price)} / ${comm.unit}`;

    // Set tombol arah dan leverage
    this.setCommodityOrderType(this.commodityOrderType, false);
    this.setCommodityOrderLeverage(this.commodityOrderLeverage, false);

    // Default margin input
    const defMargin = Math.min(this.state.cash, Math.max(10000000, Math.round(this.state.cash * 0.1)));
    const input = document.getElementById('commodity-margin-input');
    if (input) input.value = defMargin > 0 ? defMargin : '';

    const maxMarginEl = document.getElementById('commodity-max-margin-text');
    if (maxMarginEl) maxMarginEl.innerText = this.formatMoney(this.state.cash);

    this.updateCommodityOrderPreview();
    modal.classList.remove('hidden');
  },

  closeCommodityModal() {
    const modal = document.getElementById('commodity-modal');
    if (modal) modal.classList.add('hidden');
  },

  setCommodityOrderType(type, updatePreview = true) {
    this.commodityOrderType = type;
    const btnLong = document.getElementById('commodity-btn-type-long');
    const btnShort = document.getElementById('commodity-btn-type-short');
    if (btnLong && btnShort) {
      if (type === 'LONG') {
        btnLong.className = 'flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition';
        btnShort.className = 'flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition';
      } else {
        btnLong.className = 'flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition';
        btnShort.className = 'flex-1 py-2 rounded-xl bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-600/20 transition';
      }
    }
    const orderBtn = document.getElementById('commodity-submit-order-btn');
    if (orderBtn) {
      if (type === 'LONG') {
        orderBtn.className = 'btn-press w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25';
        orderBtn.innerText = 'Buka Posisi Kontrak LONG (Beli)';
      } else {
        orderBtn.className = 'btn-press w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/25';
        orderBtn.innerText = 'Buka Posisi Kontrak SHORT (Jual)';
      }
    }
    if (updatePreview) this.updateCommodityOrderPreview();
  },

  setCommodityOrderLeverage(lev, updatePreview = true) {
    this.commodityOrderLeverage = lev;
    [1, 2, 5, 10, 20].forEach(l => {
      const btn = document.getElementById(`commodity-lev-btn-${l}`);
      if (btn) {
        if (l === lev) {
          btn.className = 'btn-press py-1.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow transition';
        } else {
          btn.className = 'btn-press py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition';
        }
      }
    });
    if (updatePreview) this.updateCommodityOrderPreview();
  },

  onCommodityMarginInputChange(val) {
    this.updateCommodityOrderPreview();
  },

  setCommodityMarginQuick(val) {
    const input = document.getElementById('commodity-margin-input');
    if (!input) return;
    if (val === 'max') {
      input.value = this.state.cash;
    } else if (typeof val === 'number') {
      input.value = Math.min(this.state.cash, val);
    }
    this.updateCommodityOrderPreview();
  },

  updateCommodityOrderPreview() {
    const input = document.getElementById('commodity-margin-input');
    const margin = parseInt(input ? input.value : 0) || 0;
    const lev = this.commodityOrderLeverage || 1;
    const posValue = margin * lev;
    const sym = this.commodityDetailSymbol;
    const curPrice = (this.commodityPrices && this.commodityPrices[sym]) || 1;

    const valEl = document.getElementById('commodity-preview-position-value');
    if (valEl) valEl.innerText = this.formatMoney(posValue);

    const liqPrice = this.commodityOrderType === 'LONG'
      ? Math.max(0, Math.round(curPrice * (1 - 0.98 / lev)))
      : Math.round(curPrice * (1 + 0.98 / lev));

    const liqEl = document.getElementById('commodity-preview-liq-price');
    if (liqEl) liqEl.innerText = this.formatMoney(liqPrice);
  },

  confirmOpenCommodityPosition() {
    const input = document.getElementById('commodity-margin-input');
    const margin = parseInt(input ? input.value : 0) || 0;

    if (margin <= 0) {
      window.sound.playError();
      this.showToast('Masukkan jumlah modal margin jaminan yang valid!', 'error');
      return;
    }

    if (this.state.cash < margin) {
      window.sound.playError();
      this.showToast('Uang kas tunai tidak mencukupi untuk membuka posisi kontrak ini!', 'error');
      return;
    }

    const sym = this.commodityDetailSymbol;
    const curPrice = (this.commodityPrices && this.commodityPrices[sym]) || 100000;
    const comm = (typeof COMMODITIES_CATALOG !== 'undefined' ? COMMODITIES_CATALOG : []).find(x => x.symbol === sym);
    const commName = comm ? comm.name : sym;

    this.state.cash -= margin;
    if (!Array.isArray(this.state.commodityPositions)) {
      this.state.commodityPositions = [];
    }

    const newPos = {
      id: 'cpos_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
      symbol: sym,
      type: this.commodityOrderType,
      entryPrice: curPrice,
      margin: margin,
      leverage: this.commodityOrderLeverage,
      openedAt: this.state.gameHours
    };

    this.state.commodityPositions.push(newPos);
    this.closeCommodityModal();
    window.sound.playCash();
    this.showToast(`Berhasil membuka posisi ${newPos.type} ${commName} (${newPos.leverage}x Leverage) senilai ${this.formatCompact(margin * newPos.leverage)}!`, 'success');
    this.saveGame();
    this.render();
  },

  closeCommodityPosition(posId) {
    if (!Array.isArray(this.state.commodityPositions)) return;
    const idx = this.state.commodityPositions.findIndex(x => x.id === posId);
    if (idx === -1) return;

    const pos = this.state.commodityPositions[idx];
    const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
    const priceChange = (curPrice - pos.entryPrice) / pos.entryPrice;
    const pnlRate = (pos.type === 'LONG' ? priceChange : -priceChange) * (pos.leverage || 1);
    const pnl = Math.round(pos.margin * pnlRate);
    const returnCash = Math.max(0, pos.margin + pnl);

    this.state.cash += returnCash;
    if (!this.state.stats) {
      this.state.stats = { stockTradingProfit: 0, cryptoTradingProfit: 0, commodityTradingProfit: 0, dividendsEarned: 0, businessEarnings: 0, rentalEarnings: 0 };
    }
    this.state.stats.commodityTradingProfit = (this.state.stats.commodityTradingProfit || 0) + pnl;

    this.state.commodityPositions.splice(idx, 1);
    window.sound.playCash();
    const sign = pnl >= 0 ? '+' : '-';
    this.showToast(`Posisi ${pos.type} ${pos.symbol} ditutup! PnL: ${sign}${this.formatMoney(Math.abs(pnl))} (${(pnlRate * 100).toFixed(1)}%). Kas cair: ${this.formatCompact(returnCash)}`, pnl >= 0 ? 'success' : 'warning');
    this.saveGame();
    this.render();
  }
});
