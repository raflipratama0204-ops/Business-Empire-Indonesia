// Business Empire: RichMan - UI Render & Template Module
Object.assign(GameEngine.prototype, {
  render() {
    this.renderHeader();
    if (this.activeTab === 'home') this.renderHomeTab();
    if (this.activeTab === 'business') {
      if (this.businessView === 'owned') this.renderOwnedBusinesses();
      else if (this.businessView === 'catalog') this.renderBusinessCatalog();
      else if (this.businessView === 'detail') this.renderBusinessDetail(this.selectedBizId);
    }
    if (this.activeTab === 'invest') this.renderInvestments();
    if (this.activeTab === 'luxury') this.renderLuxury();
    if (this.activeTab === 'bank') this.renderStatsAndSettings();
  },

  renderHomeTab() {
    const netWorth = this.calculateNetWorth();
    const rank = this.getCurrentRank();
    const hourly = this.calculateHourlyIncome();

    // 1. Hitung Komposisi Finansial
    let bizVal = 0;
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(b => {
        bizVal += this.calculateBusinessValuation(b);
      });
    }

    let stocksVal = 0;
    for (const [sym, st] of Object.entries(this.state.stocks)) {
      if (st.shares > 0 && this.stockPrices[sym]) {
        stocksVal += st.shares * this.stockPrices[sym];
      }
    }

    let cryptoVal = 0;
    for (const [sym, cr] of Object.entries(this.state.crypto)) {
      if (cr.amount > 0.00001 && this.cryptoPrices[sym]) {
        cryptoVal += cr.amount * this.cryptoPrices[sym];
      }
    }

    let propVal = 0;
    for (const [id, val] of Object.entries(this.state.properties)) {
      const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
      const count = typeof val === 'number' ? val : (val ? val.count : 0);
      if (prop && count > 0) {
        let singleVal = prop.price;
        if (typeof val === 'object') {
          if (val.furnished) singleVal += prop.furnitureCost;
          if (val.internet) singleVal += prop.internetCost;
        }
        propVal += singleVal * count;
      }
    }

    let luxVal = 0;
    for (const id of this.state.luxury) {
      const lux = LUXURY_CATALOG.find(x => x.id === id);
      if (lux) luxVal += lux.price;
    }

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.innerText = text;
    };

    setEl('home-val-cash', this.formatMoney(this.state.cash));
    setEl('home-val-biz', this.formatMoney(bizVal));
    setEl('home-val-stocks', this.formatMoney(stocksVal));
    setEl('home-val-crypto', this.formatMoney(cryptoVal));
    setEl('home-val-property', this.formatMoney(propVal));
    setEl('home-val-luxury', this.formatMoney(luxVal));

    // 2. Kartu Target Pangkat
    const rankCard = document.getElementById('home-rank-card');
    if (rankCard) {
      const curIndex = NET_WORTH_RANKS.findIndex(r => r.id === rank.id);
      const nextRank = curIndex < NET_WORTH_RANKS.length - 1 ? NET_WORTH_RANKS[curIndex + 1] : null;

      if (nextRank) {
        const span = nextRank.min - rank.min;
        const currentProgress = Math.max(0, netWorth - rank.min);
        const percent = Math.min(100, Math.floor((currentProgress / span) * 100));
        const needed = Math.max(0, nextRank.min - netWorth);

        rankCard.innerHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl">${rank.badge}</span>
              <div>
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Gelar Saat Ini</span>
                <h4 class="font-black text-white text-sm">${rank.title}</h4>
              </div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Berikutnya</span>
              <div class="text-xs font-bold text-emerald-400">${nextRank.badge} ${nextRank.title}</div>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between text-[11px]">
              <span class="text-slate-400">Progres Kenaikan Pangkat:</span>
              <span class="font-bold text-white">${percent}% (Butuh ${this.formatCompact(needed)} lagi)</span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
            </div>
          </div>
        `;
      } else {
        rankCard.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-3xl">👑</span>
            <div>
              <h4 class="font-black text-amber-300 text-sm">Gelar Tertinggi: ${rank.title}</h4>
              <p class="text-[11px] text-slate-400">Selamat! Anda telah menduduki puncak tertinggi oligarki keuangan dunia!</p>
            </div>
          </div>
        `;
      }
    }

    // 3. Render Widget Pajak (KPP & DJP)
    this.renderTaxWidget();
  },

  renderHeader() {
    const netWorth = this.calculateNetWorth();
    const hourly = this.calculateHourlyIncome();
    const rank = this.getCurrentRank();

    const nwEl = document.getElementById('header-networth');
    if (nwEl) nwEl.innerText = this.formatMoney(netWorth);

    const cashEl = document.getElementById('header-cash');
    if (cashEl) cashEl.innerText = this.formatMoney(this.state.cash);

    const hourlyEl = document.getElementById('header-hourly');
    if (hourlyEl) {
      const sign = hourly >= 0 ? '+' : '';
      hourlyEl.innerText = `${sign}${this.formatMoney(hourly)}/jam`;
      hourlyEl.className = `font-bold text-sm ${hourly >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }

    const rankBadge = document.getElementById('header-rank-badge');
    const rankTitle = document.getElementById('header-rank-title');
    if (rankBadge) rankBadge.innerText = rank.badge;
    if (rankTitle) rankTitle.innerText = rank.title;

    const timeEl = document.getElementById('header-game-time');
    if (timeEl) {
      const totalHours = Math.max(0, this.state.gameHours || 0);
      const days = Math.floor(totalHours / 24) + 1;
      const currentHour = Math.floor(totalHours % 24);
      const currentMinute = Math.floor((totalHours * 60) % 60);
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      timeEl.innerText = `Hari ${days}, ${timeStr}`;
    }

    ['1', '5', '60'].forEach(s => {
      const btn = document.getElementById(`speed-btn-${s}`);
      if (btn) {
        if (this.speed === parseInt(s)) {
          btn.className = 'px-2 py-0.5 text-xs font-bold rounded bg-emerald-500 text-slate-950 shadow-sm';
        } else {
          btn.className = 'px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 hover:bg-slate-700';
        }
      }
    });

    const clickValEl = document.getElementById('click-reward-val');
    if (clickValEl) {
      const reward = Math.round(GAME_CONFIG.STARTING_CLICK_REWARD * Math.pow(1.3, this.state.clickLevel - 1));
      clickValEl.innerText = `+${this.formatCompact(reward)} / klik`;
    }
  },

  renderOwnedBusinesses() {
    const container = document.getElementById('business-owned-list');
    const countEl = document.getElementById('biz-owned-count');
    const bizBanner = document.getElementById('biz-tax-banner');
    if (!container) return;

    const list = this.state.businesses || [];
    if (countEl) countEl.innerText = `${list.length} Bisnis Beroperasi`;

    // Render Tax Banner di Tab Bisnis
    if (bizBanner && this.state.businesses) {
      let totalUnpaid = 0;
      let suspendedCount = 0;
      let earliestDeadline = null;
      list.forEach(b => {
        const t = this.getBusinessTax(b);
        if (t.unpaid > 0) {
          totalUnpaid += t.unpaid;
          if (t.suspended) suspendedCount++;
          if (t.deadline && (!earliestDeadline || t.deadline < earliestDeadline)) {
            earliestDeadline = t.deadline;
          }
        }
      });

      if (suspendedCount > 0) {
        bizBanner.className = 'mb-3.5 p-3.5 rounded-2xl bg-rose-500/10 border tax-suspended-glow border-rose-500 text-xs shadow-lg space-y-2';
        bizBanner.innerHTML = `
          <div class="flex items-center justify-between text-rose-400 font-black">
            <span class="flex items-center gap-1.5">🚨 ${suspendedCount} BISNIS DIBEKUKAN OLEH KANTOR PAJAK (DJP)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black">SANKSI DJP</span>
          </div>
          <p class="text-[11px] text-slate-300">
            Anda memiliki tunggakan pajak bisnis sebesar <strong class="text-rose-400">${this.formatMoney(totalUnpaid)}</strong> yang telah melewati batas 72 jam dunia nyata. Seluruh arus kas masuk bisnis yang menunggak dihentikan sampai dilunasi!
          </p>
          <button onclick="game.payTax('business')" class="btn-press w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5">
            <span>💳 Lunasi Seluruh Pajak Bisnis (${this.formatMoney(totalUnpaid)})</span>
          </button>
        `;
        bizBanner.classList.remove('hidden');
      } else if (totalUnpaid > 0) {
        const remSec = earliestDeadline ? Math.max(0, Math.ceil((earliestDeadline - Date.now()) / 1000)) : 0;
        const hours = Math.floor(remSec / 3600);
        const mins = Math.floor((remSec % 3600) / 60);
        const secs = remSec % 60;
        const timeStr = hours > 0 ? `${hours}j ${mins}m` : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        bizBanner.className = 'mb-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs shadow-md space-y-2';
        bizBanner.innerHTML = `
          <div class="flex items-center justify-between text-amber-300 font-bold">
            <span class="flex items-center gap-1.5">⏳ Tagihan SPT Pajak Mandiri Bisnis Berjalan</span>
            <span class="font-mono text-amber-400 font-bold" data-tax-timer="${earliestDeadline || 0}">${timeStr}</span>
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-300">Total Pajak Bisnis Terhutang (5%): <strong class="text-amber-300">${this.formatMoney(totalUnpaid)}</strong></span>
            <button onclick="game.payTax('business')" class="btn-press px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
              Bayar Semua Pajak
            </button>
          </div>
        `;
        bizBanner.classList.remove('hidden');
      } else {
        bizBanner.className = 'hidden mb-3';
        bizBanner.innerHTML = '';
      }
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
          <div class="text-4xl">🏢</div>
          <h3 class="font-bold text-white text-sm">Belum Ada Bisnis yang Dibuka</h3>
          <p class="text-xs text-slate-400">Anda belum mendirikan perusahaan apa pun. Klik tombol di bawah untuk memilih sektor usaha pertama Anda!</p>
          <button onclick="game.showBusinessCatalog()" class="btn-press px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
            + Buka Bisnis Pertama Anda
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    list.forEach(biz => {
      const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
      const rawRev = this.calculateSingleBusinessRevenue(biz);
      const isTech = sector.isTech || biz.sectorId === 'tech';
      const isAirline = sector.isAirline || biz.sectorId === 'airline';
      const isOil = sector.isOil || biz.sectorId === 'oil';
      const isMining = sector.isMining || biz.sectorId === 'mining';
      const bizTax = this.getBusinessTax(biz);
      const isBizSuspended = !!bizTax.suspended;
      const bizValuation = this.calculateBusinessValuation(biz);
      const allTimeEarn = biz.allTimeEarnings || 0;
      let airlineStats = null;
      if (isAirline) {
        airlineStats = this.getAirlineOperatingStats(biz);
      }

      let revText = '';
      if (isBizSuspended) {
        revText = 'Rp 0/jam (Disuspend)';
      } else if (isTech) {
        revText = rawRev < 0 ? `-${this.formatCompact(Math.abs(rawRev))}/j (Gaji)` : 'Honor Proyek';
      } else if (isAirline && airlineStats) {
        if (airlineStats.operatingRoutesCount === 0 || airlineStats.operatingPlanesCount === 0) {
          revText = '<span class="text-rose-400 font-bold">0/j (Grounded)</span>';
        } else {
          revText = `+${this.formatCompact(airlineStats.grossRevenue)}/j (Tiket)`;
        }
      } else {
        revText = `${rawRev >= 0 ? '+' : ''}${this.formatCompact(rawRev)}/jam`;
      }

      let statusInfo = '';
      if (sector.isFleet) {
        const totalVeh = (biz.vehicles || []).length;
        statusInfo = `Armada: ${totalVeh}/${biz.parkingCapacity || 10} Kendaraan`;
      } else if (sector.isLogistics) {
        const totalTrucks = (biz.trucks || []).length;
        const totalTenants = (biz.tenants || []).length;
        const maxWare = Math.min(10, Math.max(1, biz.warehouseCapacity || biz.warehouseLevel || 1));
        statusInfo = `${totalTrucks} Truk • ${totalTenants}/${maxWare} Mitra Gudang (Lvl ${biz.warehouseLevel || 1})`;
      } else if (isTech) {
        const totalEmpl = this.getTechTotalEmployees(biz);
        const salaries = this.getTechHourlySalaries(biz);
        statusInfo = `${totalEmpl}/${biz.workstations || 15} Karyawan • Gaji: -${this.formatCompact(salaries)}/j`;
      } else if (isAirline && airlineStats) {
        statusInfo = `${airlineStats.operatingPlanesCount}/${airlineStats.totalPlanes} Pesawat Terbang • ${airlineStats.openRoutesCount} Rute Internasional`;
      } else if (isOil) {
        const oilStats = this.getOilProductionStats(biz);
        const signedContracts = (biz.contracts || []).length;
        statusInfo = `Produksi: ${this.formatCompact(oilStats.totalOilBblPerHour)} Bbl • ${this.formatCompact(oilStats.totalGasBoePerHour)} BOE • ${signedContracts} Kontrak`;
      } else if (isMining) {
        const miningStats = this.getMiningProductionStats(biz);
        const signedContracts = (biz.contracts || []).length;
        statusInfo = `Produksi: ${this.formatCompact(miningStats.totalNickelTonPerHour)} Ton • ${this.formatCompact(miningStats.totalGoldKgPerHour)} Kg • ${signedContracts} Kontrak`;
      } else if (sector.isBank) {
        const custDep = this.getBankCustomerDeposits(biz);
        const growthRate = this.getBankDepositGrowthRate(biz);
        statusInfo = `Brankas: ${this.formatCompact(biz.vault || 0)} • DPK: ${this.formatCompact(custDep)} (+${this.formatCompact(growthRate)}/j)`;
      } else if (biz.sectorId === 'fashion') {
        const stage = FASHION_STAGES[Math.min(biz.level, FASHION_STAGES.length) - 1];
        statusInfo = `Tahap: ${stage.title}`;
      } else {
        statusInfo = `Tingkat Level ${biz.level}`;
      }

      const upCost = this.getBusinessUpgradeCost(biz);
      const isBank = biz.sectorId === 'bank';
      let bankReqMet = true;
      if (isBank) {
        const custDep = this.getBankCustomerDeposits(biz);
        const reqDep = this.getBankRequiredCustomerDeposits(biz.level);
        bankReqMet = custDep >= reqDep;
      }

      html += `
        <div class="glass-panel rounded-2xl border ${isBizSuspended ? 'tax-suspended-glow border-rose-500/80 bg-rose-950/10' : 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/5 to-transparent'} overflow-hidden card-transition mb-3.5 shadow-lg">
          <div class="relative h-28 w-full bg-slate-800 overflow-hidden">
            <img src="${sector.image}" alt="${biz.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.style.display='none'">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            <div class="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-semibold text-slate-300 max-w-[150px] truncate">
              <span class="text-xs">${sector.icon}</span>
              <span class="truncate">${sector.name}</span>
            </div>

            <div class="absolute top-2 right-2">
              ${isBizSuspended ? `
                <span class="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20 text-[10px] tax-warning-pulse whitespace-nowrap">
                  ⚠️ Dibekukan DJP
                </span>
              ` : `
                <span class="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 text-[10px] whitespace-nowrap">
                  Aktif
                </span>
              `}
            </div>

            <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
              <div class="min-w-0 flex-1 pr-1">
                <h3 class="font-black text-white text-sm sm:text-base leading-tight drop-shadow-md truncate">${biz.name}</h3>
                <span class="text-[10px] text-slate-300 font-medium truncate block">${statusInfo}</span>
              </div>
              <span class="text-[11px] font-black shrink-0 ${isBizSuspended ? 'text-rose-400 border-rose-500/50' : (rawRev < 0 ? 'text-rose-400 border-slate-800' : 'text-emerald-400 border-slate-800')} bg-slate-950/90 px-2 py-0.5 rounded-lg border whitespace-nowrap">
                ${revText}
              </span>
            </div>
          </div>

          <!-- Valuasi & Laba Bersih All-Time -->
          <div class="px-3 pt-2.5 pb-1 grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400 flex items-center gap-1 font-medium">🏛️ Valuasi Bisnis</span>
              <span class="text-xs font-black text-amber-300 font-mono mt-0.5">${this.formatMoney(bizValuation)}</span>
            </div>
            <div class="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
              <span class="text-[10px] text-slate-400 flex items-center gap-1 font-medium">📊 Laba All-Time</span>
              <span class="text-xs font-black ${allTimeEarn >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono mt-0.5">
                ${allTimeEarn >= 0 ? '+' : ''}${this.formatMoney(allTimeEarn)}
              </span>
            </div>
          </div>

          <!-- Per-Business Tax Alert jika ada tagihan -->
          ${bizTax.unpaid > 0 ? `
            <div class="mx-3 my-1.5 p-2 rounded-xl ${bizTax.suspended ? 'bg-rose-500/10 border border-rose-500/40 text-rose-300' : 'bg-amber-500/10 border border-amber-500/30 text-amber-300'} flex items-center justify-between text-[11px]">
              <div class="min-w-0 pr-2">
                <span class="font-bold flex items-center gap-1">
                  ${bizTax.suspended ? '🚨 Operasional Dibekukan' : '⏳ SPT Pajak Mandiri (5%)'}
                </span>
                <span class="text-[10px] text-slate-300 block truncate">
                  Terhutang: <strong class="${bizTax.suspended ? 'text-rose-400' : 'text-amber-300'}">${this.formatMoney(bizTax.unpaid)}</strong>
                  ${!bizTax.suspended && bizTax.deadline ? ` • Sisa: <span class="font-mono text-amber-400" data-tax-timer="${bizTax.deadline}">...</span>` : ''}
                </span>
              </div>
              <button onclick="game.payBusinessTax('${biz.instanceId}')" class="btn-press px-2.5 py-1 rounded-lg ${bizTax.suspended ? 'bg-rose-500 text-slate-950 font-black' : 'bg-amber-500 text-slate-950 font-bold'} text-[11px] shrink-0">
                Bayar Pajak
              </button>
            </div>
          ` : ''}

          ${biz.upgradeInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-amber-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🏗️</span> Sedang Ekspansi ke Lvl ${biz.upgradeTargetLevel}
                </span>
                <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.upgradeEndTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.upgradeStartTime}" data-biz-end="${biz.upgradeEndTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.garageUpgradeInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-amber-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🏗️</span> Perluasan Garasi (+${biz.garageUpgradeAddedSlots || 5} Slot ke ${biz.garageUpgradeTargetCapacity})
                </span>
                <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.warehouseUpgradeInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-blue-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🏗️</span> Ekspansi Gudang ke Lvl ${biz.warehouseUpgradeTargetLevel} (+1 Slot Mitra)
                </span>
                <span class="font-mono font-bold text-blue-400" data-biz-timer="${biz.warehouseUpgradeEndTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-blue-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.warehouseUpgradeStartTime}" data-biz-end="${biz.warehouseUpgradeEndTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.officeUpgradeInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-blue-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🏗️</span> Renovasi Kantor (+${biz.officeUpgradeAddedWorkstations || 15} Workstation)
                </span>
                <span class="font-mono font-bold text-blue-400" data-biz-timer="${biz.officeUpgradeEndTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-blue-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.officeUpgradeStartTime}" data-biz-end="${biz.officeUpgradeEndTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.activeProject ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl ${biz.activeProject.completed ? 'bg-emerald-500/10 border border-emerald-500/40' : 'bg-purple-500/10 border border-purple-500/30'} flex items-center justify-between text-[11px] mb-1">
                <span class="${biz.activeProject.completed ? 'text-emerald-300 font-bold' : 'text-purple-300 font-semibold'} flex items-center gap-1">
                  <span>${biz.activeProject.completed ? '🎉' : '⏱️'}</span>
                  <span class="truncate max-w-[190px]">${this.getProjectName(biz.activeProject.projectId)}</span>
                </span>
                ${biz.activeProject.completed ? `
                  <span class="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px]">Siap Diklaim</span>
                ` : `
                  <span class="font-mono font-bold text-purple-400" data-biz-timer="${biz.activeProject.endTime}">...</span>
                `}
              </div>
              ${!biz.activeProject.completed ? `
                <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div class="h-full bg-purple-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.activeProject.startTime}" data-biz-end="${biz.activeProject.endTime}"></div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${biz.routeUnlockInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-blue-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">🛫</span> Izin Rute: ${biz.routeUnlockInProgress.destination}
                </span>
                <span class="font-mono font-bold text-blue-400" data-biz-timer="${biz.routeUnlockInProgress.endTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.routeUnlockInProgress.startTime}" data-biz-end="${biz.routeUnlockInProgress.endTime}"></div>
              </div>
            </div>
          ` : ''}

          ${biz.contractSigningInProgress ? `
            <div class="px-3 pt-2">
              <div class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-[11px] mb-1">
                <span class="text-amber-300 font-bold flex items-center gap-1">
                  <span class="upgrade-pulsing-badge">📜</span> Negosiasi Kontrak Pasokan...
                </span>
                <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.contractSigningInProgress.endTime}">...</span>
              </div>
              <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.contractSigningInProgress.startTime}" data-biz-end="${biz.contractSigningInProgress.endTime}"></div>
              </div>
            </div>
          ` : ''}

          <div class="p-3 pt-2.5 flex items-center justify-between gap-2">
            <button onclick="game.showBusinessDetail('${biz.instanceId}')" class="btn-press flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
              <span>⚙️ Detail & Kelola</span>
            </button>
            ${biz.upgradeInProgress ? `
              <button disabled class="px-3.5 py-2 rounded-xl bg-slate-800/60 text-slate-500 border border-slate-800 text-xs font-bold cursor-not-allowed">
                ⏳ Pengerjaan
              </button>
            ` : (biz.sectorId === 'taxi' || biz.sectorId === 'logistics' || biz.sectorId === 'tech' || biz.sectorId === 'airline' || isOil || isMining ? `
              <div class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium flex items-center gap-1">
                <span>${
                  biz.sectorId === 'taxi' ? '🚖 ' + (biz.vehicles ? biz.vehicles.length : 0) + ' Armada' :
                  (biz.sectorId === 'logistics' ? '🚚 ' + (biz.trucks ? biz.trucks.length : 0) + ' Truk' :
                  (biz.sectorId === 'tech' ? '💻 ' + (biz.activeProject ? (biz.activeProject.completed ? '🎉 Klaim Proyek' : '⏱️ Pengerjaan') : 'Proyek & Tim') :
                  (biz.sectorId === 'airline' ? '✈️ ' + (airlineStats ? `${airlineStats.operatingPlanesCount}/${airlineStats.totalPlanes} Pesawat` : 'Rute & Armada') :
                  (isOil ? '🛢️ ' + ((biz.contracts || []).length) + ' Kontrak Migas' :
                  '⛏️ ' + ((biz.contracts || []).length) + ' Kontrak Tambang'))))
                }</span>
              </div>
            ` : (biz.sectorId === 'fashion' && biz.level >= FASHION_STAGES.length ? `
              <button disabled class="px-3.5 py-2 rounded-xl bg-slate-800/60 text-amber-300/80 border border-slate-800 text-xs font-bold cursor-default">
                👑 Max Lvl
              </button>
            ` : `
              <button onclick="game.upgradeBusinessLevel('${biz.instanceId}')" class="btn-press px-3.5 py-2 rounded-xl ${
                isBank && !bankReqMet
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              } font-bold text-xs flex items-center gap-1 shadow-sm">
                <span>${isBank && !bankReqMet ? '🔒 ' : ''}Upgrade (${this.formatCompact(upCost)})</span>
              </button>
            `))}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderBusinessCatalog() {
    const container = document.getElementById('business-catalog-list');
    if (!container) return;

    let html = '';
    BUSINESS_SECTORS.forEach(sec => {
      let priceText = '';
      if (sec.hasSubtypes) {
        priceText = `Mulai ${this.formatCompact(sec.subtypes[0].cost)}`;
      } else {
        priceText = this.formatCompact(sec.baseCost || 0);
      }

      const canAfford = this.state.cash >= (sec.hasSubtypes ? sec.subtypes[0].cost : (sec.baseCost || 0));

      html += `
        <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden card-transition mb-3.5 shadow-lg">
          <div class="relative h-28 w-full bg-slate-800 overflow-hidden">
            <img src="${sec.image}" alt="${sec.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.style.display='none'">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            <div class="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-slate-300">
              <span class="text-sm">${sec.icon}</span>
              <span>Sektor Baru</span>
            </div>

            <div class="absolute bottom-2 left-3 right-3">
              <h3 class="font-black text-white text-base leading-tight drop-shadow-md">${sec.name}</h3>
            </div>
          </div>

          <div class="p-3">
            <p class="text-xs text-slate-400 leading-relaxed mb-3">${sec.desc}</p>

            <div class="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span class="text-slate-400 text-[11px] block">Biaya Modal Awal:</span>
                <span class="font-extrabold text-white text-xs">${priceText}</span>
              </div>

              <button onclick="game.openFoundBusinessModal('${sec.sectorId}')" class="btn-press px-4 py-2 rounded-xl text-xs font-black transition ${
                canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }">
                Pilih Sektor Ini →
              </button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  renderBusinessDetail(instanceId) {
    const container = document.getElementById('biz-view-detail');
    if (!container) return;

    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) {
      this.showOwnedBusinesses();
      return;
    }

    const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
    const hourlyRev = this.calculateSingleBusinessRevenue(biz);
    const bizTax = this.getBusinessTax(biz);
    const bizValuation = this.calculateBusinessValuation(biz);
    const allTimeEarn = biz.allTimeEarnings || 0;

    let specificSectionHtml = '';

    // DETAIL: TAKSI & OJOL FLEET
    if (sector.isFleet) {
      if (!['active', 'buy'].includes(this.detailSubTab)) {
        this.detailSubTab = 'active';
      }

      const vehicles = biz.vehicles || [];
      const currentPark = vehicles.length;
      const maxPark = biz.parkingCapacity || 10;
      const isParkFull = currentPark >= maxPark;
      const isGarageUpgrading = !!biz.garageUpgradeInProgress;
      const garageDurationSec = this.getGarageUpgradeDuration(biz);

      const vehicleCards = vehicles.map(v => {
        const cat = TAXI_FLEET_VEHICLES.find(x => x.id === v.modelId);
        if (!cat) return '';
        const kmPercent = Math.min(100, Math.round((v.km / cat.maxKm) * 100));
        const scrapVal = Math.round(cat.cost * 0.35 * Math.max(0.2, 1 - (v.km / cat.maxKm)));

        return `
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-2.5">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-14 h-12 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60 relative">
                  <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                  <span class="absolute bottom-0.5 right-0.5 text-xs">${cat.icon}</span>
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-white text-xs truncate">${cat.name}</div>
                  <div class="text-[10px] text-slate-400">${cat.type}</div>
                  <div class="text-[11px] text-emerald-400 font-semibold">
                    +${this.formatCompact(cat.revenue)}/jam
                  </div>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span class="text-xs font-mono font-bold text-slate-300">
                  ${v.km.toLocaleString()} / ${cat.maxKm.toLocaleString()} KM
                </span>
                <div class="text-[10px] text-slate-400">Sisa Umur: ${Math.max(0, 100 - kmPercent)}%</div>
              </div>
            </div>

            <!-- KM Progress Bar -->
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="h-full ${kmPercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'} transition-all" style="width: ${kmPercent}%"></div>
            </div>

            <div class="flex justify-end items-center pt-1 border-t border-slate-800/60 text-xs">
              <button onclick="game.sellTaxiVehicle('${biz.instanceId}', '${v.id}')" class="btn-press px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-[11px] font-bold">
                Jual Bekas (${this.formatCompact(scrapVal)})
              </button>
            </div>
          </div>
        `;
      }).join('');

      const showroomCards = TAXI_FLEET_VEHICLES.map(cat => {
        const canBuy = this.state.cash >= cat.cost && !isParkFull;
        return `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-2.5 gap-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-16 h-14 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60 relative">
                <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                <span class="absolute bottom-0.5 right-0.5 text-xs">${cat.icon}</span>
              </div>
              <div class="min-w-0">
                <div class="font-bold text-white text-xs truncate">${cat.name}</div>
                <div class="text-[10px] text-slate-400">${cat.type}</div>
                <div class="text-[11px] text-emerald-400 font-semibold">+${this.formatCompact(cat.revenue)}/jam • Max ${cat.maxKm.toLocaleString()} KM</div>
              </div>
            </div>

            <button onclick="game.buyTaxiVehicle('${biz.instanceId}', '${cat.id}')" class="btn-press px-3.5 py-1.5 rounded-xl font-black text-xs shrink-0 ${
              canBuy
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }">
              Beli (${this.formatCompact(cat.cost)})
            </button>
          </div>
        `;
      }).join('');

      let fleetTabContent = '';
      if (this.detailSubTab === 'active') {
        fleetTabContent = `
          <!-- Parking Space Status with Real-World Timer -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isGarageUpgrading ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'} mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] text-slate-400">Kapasitas Lahan Parkiran Armada:</div>
                <div class="font-bold text-white text-sm">${currentPark} / ${maxPark} Kendaraan Terisi</div>
              </div>
              ${isGarageUpgrading ? `
                <button disabled class="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-not-allowed">
                  ⏳ Sedang Diperluas...
                </button>
              ` : `
                <button onclick="game.upgradeParkingCapacity('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span>+ Perluas Parkir (5 Slot) - Rp 35 Jt [⏱️ ${this.formatDuration(garageDurationSec)}]</span>
                </button>
              `}
            </div>
            ${isGarageUpgrading ? `
              <div class="pt-1.5 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-amber-300 font-bold flex items-center gap-1">
                    <span class="upgrade-pulsing-badge">🏗️</span> Konstruksi ke ${biz.garageUpgradeTargetCapacity} Slot
                  </span>
                  <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Active Fleet List -->
          <div>
            ${vehicles.length > 0 ? vehicleCards : `
              <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2.5">
                <div class="text-3xl">🚖</div>
                <div class="font-bold text-white text-xs">Belum Ada Armada yang Beroperasi</div>
                <p class="text-[11px] text-slate-400">Armada Anda kosong. Buka tab Pembelian Armada untuk memilih jenis mobil atau motor favorit Anda!</p>
                <button onclick="game.setDetailSubTab('buy')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                  🛒 Ke Showroom Armada
                </button>
              </div>
            `}
          </div>
        `;
      } else {
        fleetTabContent = `
          <!-- Parking Alert / Status -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isGarageUpgrading ? 'border-amber-500/50 bg-amber-500/5' : (isParkFull ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800')} mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] ${isParkFull ? 'text-amber-400 font-bold' : 'text-slate-400'}">
                  ${isParkFull ? '⚠️ Kapasitas Parkir Penuh' : 'Status Slot Parkir:'}
                </div>
                <div class="font-bold text-white text-xs">
                  ${isParkFull ? 'Harus perluas parkir agar bisa membeli armada baru' : `Tersedia ${maxPark - currentPark} slot parkir kosong (${currentPark}/${maxPark})`}
                </div>
              </div>
              ${isGarageUpgrading ? `
                <button disabled class="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-not-allowed">
                  ⏳ Sedang Diperluas...
                </button>
              ` : `
                <button onclick="game.upgradeParkingCapacity('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold">
                  + Perluas Parkir (5 Slot) - Rp 35 Jt [⏱️ ${this.formatDuration(garageDurationSec)}]
                </button>
              `}
            </div>
            ${isGarageUpgrading ? `
              <div class="pt-1.5 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-amber-300 font-bold flex items-center gap-1">
                    <span class="upgrade-pulsing-badge">🏗️</span> Konstruksi ke ${biz.garageUpgradeTargetCapacity} Slot
                  </span>
                  <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Showroom List -->
          <div>
            ${showroomCards}
          </div>
        `;
      }

      specificSectionHtml = `
        <!-- Sub-tabs: Armada Beroperasi vs Pembelian Armada -->
        <div class="flex items-center justify-between mb-3 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button onclick="game.setDetailSubTab('active')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            this.detailSubTab === 'active' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🚗 Armada Beroperasi</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
              this.detailSubTab === 'active' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-400'
            }">${vehicles.length}</span>
          </button>
          <button onclick="game.setDetailSubTab('buy')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            this.detailSubTab === 'buy' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🛒 Showroom Armada</span>
          </button>
        </div>

        ${fleetTabContent}
      `;
    }

    // DETAIL: LOGISTIK & PERGUDANGAN
    else if (sector.isLogistics) {
      if (!['active', 'buy', 'warehouse'].includes(this.detailSubTab)) {
        this.detailSubTab = 'active';
      }

      const trucks = biz.trucks || [];
      const tenants = biz.tenants || [];
      const currentPark = trucks.length;
      const maxPark = biz.parkingCapacity || 8;
      const isParkFull = currentPark >= maxPark;
      const isGarageUpgrading = !!biz.garageUpgradeInProgress;
      const garageDurationSec = this.getGarageUpgradeDuration(biz);

      biz.warehouseLevel = Math.min(10, Math.max(1, biz.warehouseLevel || biz.warehouseCapacity || 1));
      biz.warehouseCapacity = biz.warehouseLevel;
      const maxWare = biz.warehouseCapacity;
      const usedSlots = tenants.length;
      const isWarehouseUpgrading = !!biz.warehouseUpgradeInProgress;

      const truckCards = trucks.map(t => {
        const cat = LOGISTICS_FLEET_VEHICLES.find(x => x.id === t.modelId);
        if (!cat) return '';
        const kmPercent = Math.min(100, Math.round((t.km / cat.maxKm) * 100));
        const scrapVal = Math.round(cat.cost * 0.35 * Math.max(0.2, 1 - (t.km / cat.maxKm)));

        return `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mb-2.5">
            <div class="flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-14 h-12 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60 relative">
                  <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                  <span class="absolute bottom-0.5 right-0.5 text-xs">${cat.icon}</span>
                </div>
                <div class="min-w-0">
                  <div class="font-bold text-white text-xs truncate">${cat.name}</div>
                  <div class="text-[10px] text-slate-400">${cat.type}</div>
                  <div class="text-[11px] text-emerald-400 font-semibold">+${this.formatCompact(cat.revenue)}/jam</div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <span class="text-xs font-mono font-bold text-slate-300">${t.km.toLocaleString()} / ${cat.maxKm.toLocaleString()} KM</span>
                <div class="text-[10px] text-slate-400">Sisa Umur: ${Math.max(0, 100 - kmPercent)}%</div>
              </div>
            </div>

            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="h-full ${kmPercent > 80 ? 'bg-amber-400' : 'bg-emerald-400'} transition-all" style="width: ${kmPercent}%"></div>
            </div>

            <div class="flex justify-end items-center pt-1 border-t border-slate-800/60 text-xs">
              <button onclick="game.sellLogisticsTruck('${biz.instanceId}', '${t.id}')" class="btn-press px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-[11px] font-bold">
                Jual Truk Bekas (${this.formatCompact(scrapVal)})
              </button>
            </div>
          </div>
        `;
      }).join('');

      const tenantPartnersCards = LOGISTICS_TENANTS_CATALOG.map(t => {
        const isPartner = tenants.includes(t.id);
        const isLevelMet = (biz.warehouseLevel || 1) >= t.requiredWarehouseLevel;
        const isSlotAvailable = usedSlots < maxWare;
        const canAfford = this.state.cash >= t.contractFee;

        return `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-2">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${t.icon}</span>
              <div>
                <div class="font-bold text-white text-xs">${t.name}</div>
                <div class="text-[11px] text-emerald-400 font-semibold">Sewa: +${this.formatCompact(t.hourlyRent)}/jam • Butuh 1 Slot</div>
                <div class="text-[10px] ${isLevelMet ? 'text-slate-400' : 'text-amber-400 font-bold'}">Syarat: Fasilitas Gudang Min. Level ${t.requiredWarehouseLevel}</div>
              </div>
            </div>

            <div>
              ${isPartner ? `
                <button onclick="game.terminateTenantContract('${biz.instanceId}', '${t.id}')" class="btn-press px-3 py-1.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                  Putus Kontrak
                </button>
              ` : (
                !isLevelMet ? `
                  <button onclick="game.upgradeWarehouse('${biz.instanceId}')" class="btn-press px-2.5 py-1.5 rounded-xl bg-slate-800 text-amber-300 border border-amber-500/40 text-[11px] font-bold" title="Tingkatkan fasilitas gudang untuk membuka kemitraan ini">
                    🔒 Butuh Lvl ${t.requiredWarehouseLevel}
                  </button>
                ` : (
                  !isSlotAvailable ? `
                    <button disabled class="px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-700 text-[11px] font-bold cursor-not-allowed">
                      ⚠️ Slot Penuh (${usedSlots}/${maxWare})
                    </button>
                  ` : `
                    <button onclick="game.signTenantContract('${biz.instanceId}', '${t.id}')" class="btn-press px-3 py-1.5 rounded-xl ${
                      canAfford
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    } font-black text-xs">
                      Bermitra (${this.formatCompact(t.contractFee)})
                    </button>
                  `
                )
              )}
            </div>
          </div>
        `;
      }).join('');

      const truckShowroom = LOGISTICS_FLEET_VEHICLES.map(cat => {
        const canBuy = this.state.cash >= cat.cost && !isParkFull;
        return `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between mb-2.5 gap-2.5">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-16 h-14 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700/60 relative">
                <img src="${cat.image}" alt="${cat.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
                <span class="absolute bottom-0.5 right-0.5 text-xs">${cat.icon}</span>
              </div>
              <div class="min-w-0">
                <div class="font-bold text-white text-xs truncate">${cat.name}</div>
                <div class="text-[10px] text-slate-400">${cat.type}</div>
                <div class="text-[11px] text-emerald-400 font-semibold">+${this.formatCompact(cat.revenue)}/jam • Max ${cat.maxKm.toLocaleString()} KM</div>
              </div>
            </div>
            <button onclick="game.buyLogisticsTruck('${biz.instanceId}', '${cat.id}')" class="btn-press px-3.5 py-1.5 rounded-xl font-black text-xs shrink-0 ${
              canBuy
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }">
              Beli (${this.formatCompact(cat.cost)})
            </button>
          </div>
        `;
      }).join('');

      let logisticsTabContent = '';
      if (this.detailSubTab === 'active') {
        logisticsTabContent = `
          <!-- Garasi Truk Status with Real-World Timer -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isGarageUpgrading ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'} mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] text-slate-400">Kapasitas Garasi Truk:</div>
                <div class="font-bold text-white text-sm">${currentPark} / ${maxPark} Truk Terisi</div>
              </div>
              ${isGarageUpgrading ? `
                <button disabled class="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-not-allowed">
                  ⏳ Sedang Diperluas...
                </button>
              ` : `
                <button onclick="game.upgradeParkingCapacity('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span>+ Perluas Garasi (4 Slot) - Rp 95 Jt [⏱️ ${this.formatDuration(garageDurationSec)}]</span>
                </button>
              `}
            </div>
            ${isGarageUpgrading ? `
              <div class="pt-1.5 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-amber-300 font-bold flex items-center gap-1">
                    <span class="upgrade-pulsing-badge">🏗️</span> Konstruksi ke ${biz.garageUpgradeTargetCapacity} Slot
                  </span>
                  <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Active Trucks -->
          <div>
            ${trucks.length > 0 ? truckCards : `
              <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2.5">
                <div class="text-3xl">🚛</div>
                <div class="font-bold text-white text-xs">Belum Ada Truk Beroperasi</div>
                <p class="text-[11px] text-slate-400">Garasi Anda masih kosong. Buka tab Showroom Truk untuk memilih truk kargo Anda!</p>
                <button onclick="game.setDetailSubTab('buy')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                  🛒 Ke Showroom Truk
                </button>
              </div>
            `}
          </div>
        `;
      } else if (this.detailSubTab === 'buy') {
        logisticsTabContent = `
          <!-- Garasi Alert / Status -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isGarageUpgrading ? 'border-amber-500/50 bg-amber-500/5' : (isParkFull ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800')} mb-3 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[11px] ${isParkFull ? 'text-amber-400 font-bold' : 'text-slate-400'}">
                  ${isParkFull ? '⚠️ Garasi Penuh' : 'Status Slot Garasi:'}
                </div>
                <div class="font-bold text-white text-xs">
                  ${isParkFull ? 'Harus perluas garasi agar bisa menambah truk' : `Tersedia ${maxPark - currentPark} slot garasi kosong (${currentPark}/${maxPark})`}
                </div>
              </div>
              ${isGarageUpgrading ? `
                <button disabled class="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-not-allowed">
                  ⏳ Sedang Diperluas...
                </button>
              ` : `
                <button onclick="game.upgradeParkingCapacity('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold">
                  + Perluas Garasi (4 Slot) - Rp 95 Jt [⏱️ ${this.formatDuration(garageDurationSec)}]
                </button>
              `}
            </div>
            ${isGarageUpgrading ? `
              <div class="pt-1.5 border-t border-slate-800/60">
                <div class="flex items-center justify-between text-[11px] mb-1">
                  <span class="text-amber-300 font-bold flex items-center gap-1">
                    <span class="upgrade-pulsing-badge">🏗️</span> Konstruksi ke ${biz.garageUpgradeTargetCapacity} Slot
                  </span>
                  <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.garageUpgradeEndTime}">...</span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.garageUpgradeStartTime}" data-biz-end="${biz.garageUpgradeEndTime}"></div>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Truck Showroom -->
          <div>
            ${truckShowroom}
          </div>
        `;
      } else if (this.detailSubTab === 'warehouse') {
        const curTier = WAREHOUSE_TIERS.find(t => t.level === (biz.warehouseLevel || 1)) || WAREHOUSE_TIERS[0];
        const nextTier = WAREHOUSE_TIERS.find(t => t.level === (biz.warehouseLevel || 1) + 1);

        logisticsTabContent = `
          <!-- Fasilitas & Tingkat Pergudangan -->
          <div class="p-3.5 rounded-xl bg-slate-950 border ${isWarehouseUpgrading ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800'} space-y-2 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Tingkat Fasilitas & Slot Gudang:</span>
                <span class="font-bold text-white text-xs ${isWarehouseUpgrading ? 'text-blue-400' : 'text-emerald-400'}">Level ${biz.warehouseLevel || 1} • ${curTier.name}</span>
              </div>
              <span class="text-xs font-mono text-slate-300 font-bold">${usedSlots} / ${maxWare} Slot Mitra Terisi</span>
            </div>
            <p class="text-[11px] text-slate-400">${curTier.desc}</p>

            <div class="pt-1 border-t border-slate-800/80">
              ${isWarehouseUpgrading ? `
                <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-blue-300 font-bold flex items-center gap-1">
                      <span class="upgrade-pulsing-badge">🏗️</span> Sedang Ekspansi ke Level ${biz.warehouseUpgradeTargetLevel} (+1 Slot Mitra)
                    </span>
                    <span class="font-mono font-bold text-blue-400" data-biz-timer="${biz.warehouseUpgradeEndTime}">...</span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div data-biz-progress data-biz-start="${biz.warehouseUpgradeStartTime}" data-biz-end="${biz.warehouseUpgradeEndTime}" class="h-full bg-gradient-to-r from-blue-500 to-emerald-400 progress-striped rounded-full"></div>
                  </div>
                </div>
              ` : (nextTier && (biz.warehouseLevel || 1) < 10 ? `
                <button onclick="game.upgradeWarehouse('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                  <span>⬆️ Perluas Slot & Fasilitas ke Level ${nextTier.level} (+1 Slot: ${nextTier.name}) - ${this.formatCompact(nextTier.upgradeCost)} [⏱️ ${this.formatDuration(nextTier.upgradeDuration)}]</span>
                </button>
              ` : `
                <div class="text-xs text-amber-300 font-bold text-center py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  👑 Fasilitas Gudang & 10 Slot Mitra Telah Mencapai Tingkat Maksimal (Level 10)
                </div>
              `)}
            </div>
          </div>

          <!-- Deskripsi Kemitraan -->
          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-1">Daftar 10 Mitra Penyewa Gudang</h4>
            <p class="text-[11px] text-slate-400 mb-2">Bermitra dengan perusahaan penyewa untuk mengisi slot gudang (1 slot per mitra). Setiap kenaikan level membuka 1 slot dan 1 mitra baru hingga maksimal 10 mitra.</p>
          </div>
          
          <div>
            ${tenantPartnersCards}
          </div>
        `;
      }

      specificSectionHtml = `
        <!-- Sub-tabs: Truk Beroperasi vs Pembelian Truk vs Mitra Gudang -->
        <div class="flex items-center justify-between mb-3 bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button onclick="game.setDetailSubTab('active')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            this.detailSubTab === 'active' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🚛 Truk Aktif</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
              this.detailSubTab === 'active' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-400'
            }">${trucks.length}</span>
          </button>
          <button onclick="game.setDetailSubTab('buy')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            this.detailSubTab === 'buy' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🛒 Showroom</span>
          </button>
          <button onclick="game.setDetailSubTab('warehouse')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
            this.detailSubTab === 'warehouse' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
          }">
            <span>🏢 Mitra Gudang</span>
            <span class="px-1.5 py-0.5 rounded-full text-[10px] ${
              this.detailSubTab === 'warehouse' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-400'
            }">${tenants.length}</span>
          </button>
        </div>

        ${logisticsTabContent}
      `;
    }

    // DETAIL: BRAND FASHION ROADMAP & TAHAPAN
    else if (biz.sectorId === 'fashion') {
      const curStageIdx = Math.min(biz.level, FASHION_STAGES.length) - 1;
      const curStage = FASHION_STAGES[curStageIdx] || FASHION_STAGES[0];
      const isMaxStage = biz.level >= FASHION_STAGES.length;
      const nextStage = !isMaxStage ? FASHION_STAGES[biz.level] : null;
      const upgradeCost = this.getBusinessUpgradeCost(biz);
      const isUpgrading = !!biz.upgradeInProgress;

      let upgradeActionHtml = '';
      if (isUpgrading) {
        const remSec = Math.max(0, Math.ceil((biz.upgradeEndTime - Date.now()) / 1000));
        const startTime = biz.upgradeStartTime || Date.now();
        const endTime = biz.upgradeEndTime || (Date.now() + 1000);
        const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

        upgradeActionHtml = `
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-amber-300 flex items-center gap-1.5">
                <span class="upgrade-pulsing-badge">🏗️</span>
                Ekspansi Menuju Level ${biz.upgradeTargetLevel} Sedang Berjalan
              </span>
              <span data-biz-timer="${biz.upgradeEndTime}" class="font-mono font-bold text-amber-400">
                ${this.formatDuration(remSec)}
              </span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 progress-striped" style="width: ${progress}%"></div>
            </div>
            <div class="text-[11px] text-slate-400 text-center">Desainer & tim produksi sedang mempersiapkan fasilitas baru...</div>
          </div>
        `;
      } else if (!isMaxStage && nextStage) {
        const canAfford = this.state.cash >= upgradeCost;
        upgradeActionHtml = `
          <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div class="flex justify-between items-center text-xs">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Tingkatkan ke Tahap Berikutnya:</span>
                <span class="font-bold text-white">${nextStage.icon} Level ${nextStage.level}: ${nextStage.title}</span>
              </div>
              <span class="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold">
                ⏱️ ${this.formatDuration(nextStage.upgradeDuration)}
              </span>
            </div>
            <button onclick="game.upgradeBusinessLevel('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition ${
              canAfford
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }">
              Mulai Proyek Ekspansi (${this.formatCompact(upgradeCost)})
            </button>
          </div>
        `;
      } else {
        upgradeActionHtml = `
          <div class="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border border-amber-400/30 text-center space-y-1">
            <div class="text-xl">👑</div>
            <div class="font-black text-amber-300 text-xs">Puncak Mahakarya Adibusana Dunia</div>
            <p class="text-[11px] text-slate-300">Brand Anda telah tampil di Paris Fashion Week dan menguasai pasar kemewahan global.</p>
          </div>
        `;
      }

      // Visual Stepper Roadmap
      const roadmapStepsHtml = FASHION_STAGES.map(s => {
        const isPast = biz.level > s.level;
        const isCurrent = biz.level === s.level;

        let badgeClass = 'border-slate-800 bg-slate-950 text-slate-500';
        let statusBadge = '<span class="text-[10px] text-slate-500">🔒 Belum Terbuka</span>';
        if (isPast) {
          badgeClass = 'border-emerald-500/40 bg-emerald-500/5 text-slate-200';
          statusBadge = '<span class="text-[10px] text-emerald-400 font-bold">✓ Selesai Dicapai</span>';
        } else if (isCurrent) {
          badgeClass = 'border-amber-400/60 bg-amber-400/10 text-white shadow-sm ring-1 ring-amber-400/30';
          statusBadge = '<span class="text-[10px] text-amber-300 font-black animate-pulse">🔥 Tahap Operasional Saat Ini</span>';
        }

        return `
          <div class="p-3 rounded-xl border ${badgeClass} space-y-1.5 transition">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">${s.icon}</span>
                <div>
                  <div class="font-bold text-xs ${isCurrent ? 'text-amber-300 font-black' : (isPast ? 'text-white' : 'text-slate-400')}">
                    Level ${s.level}: ${s.title}
                  </div>
                  <div class="text-[10px] text-slate-400">${s.marketScope}</div>
                </div>
              </div>
              <div class="text-right">
                ${statusBadge}
                <div class="text-[10px] font-mono font-bold ${isCurrent ? 'text-emerald-400' : 'text-slate-400'}">${s.multiplier}x Multiplier Omzet</div>
              </div>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">${s.desc}</p>
          </div>
        `;
      }).join('');

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Status Banner Saat Ini -->
          <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] text-slate-400 font-semibold">Tahap Operasional Sekarang:</span>
              <span class="text-xs font-mono font-black text-amber-300">Level ${curStage.level} / ${FASHION_STAGES.length}</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${curStage.icon}</span>
              <div>
                <h4 class="font-bold text-white text-sm">${curStage.title}</h4>
                <div class="text-[11px] text-emerald-400 font-semibold">Cakupan Pasar: ${curStage.marketScope}</div>
              </div>
            </div>
            <div class="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              ${curStage.desc}
            </div>
          </div>

          <!-- Aksi Upgrade / Timer Proyek -->
          ${upgradeActionHtml}

          <!-- Roadmap Jenjang Level (1 - 6) -->
          <div class="space-y-2 pt-1">
            <div class="flex items-center justify-between">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Roadmap Tahapan Brand Fashion</h4>
              <span class="text-[10px] text-slate-500">6 Tingkatan</span>
            </div>
            <div class="space-y-2">
              ${roadmapStepsHtml}
            </div>
          </div>
        </div>
      `;
    }

    // DETAIL: BANK
    else if (sector.isBank) {
      const custDep = this.getBankCustomerDeposits(biz);
      const reqDep = this.getBankRequiredCustomerDeposits(biz.level);
      const growthRate = this.getBankDepositGrowthRate(biz);
      const isReqMet = custDep >= reqDep;
      const percentDep = Math.min(100, Math.floor((custDep / reqDep) * 100));
      const upgradeCost = this.getBusinessUpgradeCost(biz);
      const durationSec = this.getUpgradeDurationSeconds(biz);
      const isUpgrading = !!biz.upgradeInProgress;
      const canAfford = this.state.cash >= upgradeCost;

      let upgradeActionHtml = '';
      if (isUpgrading) {
        const remSec = Math.max(0, Math.ceil((biz.upgradeEndTime - Date.now()) / 1000));
        const startTime = biz.upgradeStartTime || Date.now();
        const endTime = biz.upgradeEndTime || (Date.now() + 1000);
        const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

        upgradeActionHtml = `
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-blue-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-blue-300 flex items-center gap-1.5">
                <span class="upgrade-pulsing-badge">🏗️</span>
                Ekspansi Akreditasi Level ${biz.upgradeTargetLevel} Sedang Berjalan
              </span>
              <span data-biz-timer="${biz.upgradeEndTime}" class="font-mono font-bold text-blue-400">
                ${this.formatDuration(remSec)}
              </span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-blue-400 progress-striped" style="width: ${progress}%"></div>
            </div>
            <div class="text-[11px] text-slate-400 text-center">Otoritas jasa keuangan & arsitek sedang meninjau gedung kantor cabang baru...</div>
          </div>
        `;
      } else {
        upgradeActionHtml = `
          <button onclick="game.upgradeBusinessLevel('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition ${
            canAfford && isReqMet
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }">
            ${!isReqMet ? `🔒 Butuh DPK ${this.formatCompact(reqDep)} • ` : ''}Tingkatkan Bank ke Level ${biz.level + 1} (${this.formatCompact(upgradeCost)}) • ⏱️ ${this.formatDuration(durationSec)}
          </button>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Status Modal & Simpanan Nasabah -->
          <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-slate-400">Akreditasi Bank:</span>
              <span class="font-extrabold text-blue-400 font-mono text-sm">Level ${biz.level}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Cadangan Kas Brankas:</span>
              <span class="font-bold text-emerald-400">${this.formatMoney(biz.vault || 0)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Total Simpanan Nasabah (DPK):</span>
              <span class="font-black text-white text-sm">${this.formatMoney(custDep)}</span>
            </div>
            <div class="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
              <span class="text-slate-400">Arus Masuk Nasabah Otomatis:</span>
              <span class="font-bold text-blue-400">+${this.formatCompact(growthRate)}/jam</span>
            </div>
          </div>

          <!-- Syarat Ekspansi Level Berikutnya -->
          <div class="glass-panel p-4 rounded-2xl border ${isReqMet ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'} space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold ${isReqMet ? 'text-emerald-400' : 'text-amber-300'} flex items-center gap-1.5">
                <span>${isReqMet ? '✅' : '📋'}</span>
                Syarat Ekspansi Akreditasi Level ${biz.level + 1}
              </span>
              <span class="font-mono font-bold ${isReqMet ? 'text-emerald-400' : 'text-amber-400'}">${percentDep}%</span>
            </div>
            
            <div class="flex items-center justify-between text-[11px] pt-1">
              <span class="text-slate-400">Target Simpanan Nasabah:</span>
              <span class="font-bold text-white">${this.formatMoney(reqDep)}</span>
            </div>

            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="h-full ${isReqMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${percentDep}%"></div>
            </div>

            <div class="text-[11px] ${isReqMet ? 'text-emerald-300 font-semibold' : 'text-slate-400'} pt-1">
              ${isReqMet 
                ? '✓ Syarat simpanan nasabah telah terpenuhi! Anda dapat memulai proyek ekspansi.' 
                : `💡 Butuh tambahan DPK nasabah senilai ${this.formatCompact(reqDep - custDep)} lagi. Simpanan bertambah sendiri seiring waktu & saat offline (+${this.formatCompact(growthRate)}/jam). Naikkan bunga simpanan di panel pengaturan untuk mempercepat arus masuk nasabah!`
              }
            </div>
          </div>

          <!-- Aksi Upgrade Level Bank -->
          ${upgradeActionHtml}

          <!-- Buka Panel Suku Bunga & Brankas -->
          <button onclick="game.openBankModal('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
            <span>⚙️ Atur Suku Bunga & Setor/Tarik Brankas Bank</span>
          </button>
        </div>
      `;
    }

    // DETAIL: SOFTWARE HOUSE / GAME STUDIO (TECH)
    else if (sector.isTech || biz.sectorId === 'tech') {
      if (!['projects', 'team', 'office'].includes(this.detailSubTab)) {
        this.detailSubTab = 'projects';
      }

      const totalEmployees = this.getTechTotalEmployees(biz);
      const workstations = biz.workstations || 15;
      const hourlySalary = this.getTechHourlySalaries(biz);
      const activeProject = biz.activeProject;
      const isProjectRunning = !!activeProject && !activeProject.completed;
      const isProjectReady = !!activeProject && activeProject.completed;
      const isOfficeUpgrading = !!biz.officeUpgradeInProgress;

      let techTabContent = '';

      // SUB-TAB 1: PROYEK SOFTWARE (11 PROYEK)
      if (this.detailSubTab === 'projects') {
        let activeProjectCardHtml = '';
        if (isProjectReady) {
          activeProjectCardHtml = `
            <div class="p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-xs shadow-lg space-y-2 mb-3">
              <div class="flex items-center justify-between">
                <span class="font-black text-emerald-400 flex items-center gap-1.5 text-sm">
                  <span>🎉</span> Pengerjaan Proyek Selesai!
                </span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black uppercase tracking-wider">
                  Siap Klaim
                </span>
              </div>
              <div class="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div class="font-bold text-white text-xs">${activeProject.name}</div>
                  <div class="text-[11px] text-slate-400">Honor Proyek Selesai Divalidasi</div>
                </div>
                <div class="font-black text-emerald-400 font-mono text-sm">${this.formatMoney(activeProject.reward)}</div>
              </div>
              <p class="text-[11px] text-slate-300">
                Uang pembayaran proyek tidak akan masuk ke kas sebelum Anda menekan tombol klaim di bawah ini.
              </p>
              <button onclick="game.claimTechProject('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/30 flex items-center justify-center gap-1.5">
                <span>💰 Klaim Hasil Proyek (${this.formatMoney(activeProject.reward)})</span>
              </button>
            </div>
          `;
        } else if (isProjectRunning) {
          const remSec = Math.max(0, Math.ceil((activeProject.endTime - Date.now()) / 1000));
          const startTime = activeProject.startTime || Date.now();
          const endTime = activeProject.endTime || (Date.now() + 1000);
          const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

          activeProjectCardHtml = `
            <div class="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/40 text-xs shadow-lg space-y-2 mb-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-purple-300 flex items-center gap-1.5">
                  <span class="upgrade-pulsing-badge">💻</span> Proyek Sedang Dikerjakan Tim
                </span>
                <span data-biz-timer="${activeProject.endTime}" class="font-mono font-bold text-purple-400">
                  ${this.formatDuration(remSec)}
                </span>
              </div>
              <div class="bg-slate-950/70 p-2.5 rounded-xl border border-purple-500/20 flex items-center justify-between">
                <div>
                  <div class="font-bold text-white text-xs">${activeProject.name}</div>
                  <div class="text-[11px] text-slate-400">Imbalan Kontrak Saat Selesai</div>
                </div>
                <div class="font-black text-purple-300 font-mono text-xs">${this.formatMoney(activeProject.reward)}</div>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-gradient-to-r from-purple-500 to-pink-500 progress-striped" style="width: ${progress}%"></div>
              </div>
              <div class="text-[10px] text-slate-400 flex items-center justify-between">
                <span>⏱️ Waktu Pengerjaan Real-Time</span>
                <span>Gaji Karyawan Tetap Dibayar: -${this.formatCompact(hourlySalary)}/jam</span>
              </div>
            </div>
          `;
        } else {
          activeProjectCardHtml = `
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">💤</span>
                <div>
                  <div class="font-bold text-slate-300">Belum Ada Proyek Aktif</div>
                  <div class="text-[11px] text-slate-500">Pilih salah satu kontrak proyek di katalog bawah untuk mulai menghasilkan uang.</div>
                </div>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">Idle</span>
            </div>
          `;
        }

        // Render Catalog of 11 Projects
        const projectsListHtml = TECH_PROJECTS_CATALOG.map((proj, idx) => {
          const reqDev = proj.req.dev || 0;
          const reqLead = proj.req.lead || 0;
          const reqDes = proj.req.designer || 0;
          const reqTest = proj.req.tester || 0;

          const curDev = biz.employees?.dev || 0;
          const curLead = biz.employees?.lead || 0;
          const curDes = biz.employees?.designer || 0;
          const curTest = biz.employees?.tester || 0;

          const hasDev = curDev >= reqDev;
          const hasLead = curLead >= reqLead;
          const hasDes = curDes >= reqDes;
          const hasTest = curTest >= reqTest;
          const isEligible = hasDev && hasLead && hasDes && hasTest;

          let btnHtml = '';
          if (activeProject) {
            btnHtml = `
              <button disabled class="w-full py-2 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700/50">
                Sedang Mengerjakan Proyek Lain
              </button>
            `;
          } else if (!isEligible) {
            btnHtml = `
              <button disabled class="w-full py-2 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs cursor-not-allowed border border-rose-500/20">
                ⚠️ Karyawan Belum Cukup (Cek Syarat Tim)
              </button>
            `;
          } else {
            btnHtml = `
              <button onclick="game.startTechProject('${biz.instanceId}', '${proj.id}')" class="btn-press w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5">
                <span>🚀 Ambil Kontrak Proyek • ⏱️ ${this.formatDuration(proj.durationSeconds)}</span>
              </button>
            `;
          }

          return `
            <div class="glass-panel p-3.5 rounded-2xl border ${isEligible ? 'border-slate-800 hover:border-emerald-500/40' : 'border-slate-800/80 opacity-90'} space-y-2.5 transition">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${proj.icon}</span>
                  <div>
                    <div class="font-black text-white text-xs">${idx + 1}. ${proj.name}</div>
                    <div class="text-[10px] text-slate-400">${proj.desc}</div>
                  </div>
                </div>
              </div>

              <!-- Reward & Durasi -->
              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 block">Nilai Honor Proyek:</span>
                  <span class="font-black text-emerald-400 font-mono">${this.formatMoney(proj.reward)}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">Waktu Pengerjaan:</span>
                  <span class="font-bold text-amber-400 font-mono">⏱️ ${this.formatDuration(proj.durationSeconds)}</span>
                </div>
              </div>

              <!-- Syarat Karyawan -->
              <div class="space-y-1">
                <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syarat Tenaga Ahli:</div>
                <div class="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div class="p-1.5 rounded-lg border ${hasDev ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/5 border-rose-500/30 text-rose-300'} flex items-center justify-between">
                    <span>👨‍💻 Dev:</span>
                    <span class="font-mono font-bold">${curDev}/${reqDev} ${hasDev ? '✓' : '✗'}</span>
                  </div>
                  <div class="p-1.5 rounded-lg border ${hasLead ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/5 border-rose-500/30 text-rose-300'} flex items-center justify-between">
                    <span>👔 Lead:</span>
                    <span class="font-mono font-bold">${curLead}/${reqLead} ${hasLead ? '✓' : '✗'}</span>
                  </div>
                  <div class="p-1.5 rounded-lg border ${hasDes ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/5 border-rose-500/30 text-rose-300'} flex items-center justify-between">
                    <span>🎨 Desainer:</span>
                    <span class="font-mono font-bold">${curDes}/${reqDes} ${hasDes ? '✓' : '✗'}</span>
                  </div>
                  <div class="p-1.5 rounded-lg border ${hasTest ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/5 border-rose-500/30 text-rose-300'} flex items-center justify-between">
                    <span>🔍 Tester:</span>
                    <span class="font-mono font-bold">${curTest}/${reqTest} ${hasTest ? '✓' : '✗'}</span>
                  </div>
                </div>
              </div>

              <!-- Tombol Aksi -->
              ${btnHtml}
            </div>
          `;
        }).join('');

        techTabContent = `
          ${activeProjectCardHtml}

          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Katalog Kontrak Proyek Software (11 Proyek)</h4>
            <p class="text-[11px] text-slate-400">Pilih proyek sesuai kapasitas karyawan Anda. Semakin besar proyek, semakin besar imbalan dan waktu yang dibutuhkan.</p>
          </div>

          <div class="space-y-3">
            ${projectsListHtml}
          </div>
        `;
      }

      // SUB-TAB 2: TIM & KARYAWAN
      else if (this.detailSubTab === 'team') {
        const occPercent = Math.min(100, Math.round((totalEmployees / workstations) * 100));

        const rolesHtml = TECH_ROLES.map(role => {
          const count = biz.employees?.[role.id] || 0;
          const roleSalary = count * role.salary;
          const canHire1 = totalEmployees + 1 <= workstations && this.state.cash >= role.hireCost;
          const canHire5 = totalEmployees + 5 <= workstations && this.state.cash >= (role.hireCost * 5);
          const canFire1 = count > 0;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${role.icon}</span>
                  <div>
                    <h5 class="font-bold text-white text-xs">${role.name}</h5>
                    <div class="text-[10px] text-slate-400">${role.title} • ${role.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-mono font-black text-amber-300 text-sm">${count} Orang</div>
                  <div class="text-[10px] text-rose-400 font-mono">-${this.formatCompact(roleSalary)}/jam</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Gaji: <strong class="text-slate-200">${this.formatCompact(role.salary)}/org/jam</strong></span>
                <span class="text-slate-400">Biaya Rekrut: <strong class="text-emerald-400">${this.formatCompact(role.hireCost)}</strong></span>
              </div>

              <!-- Tombol Rekrut & PHK -->
              <div class="grid grid-cols-3 gap-1.5 pt-0.5">
                <button onclick="game.hireTechEmployee('${biz.instanceId}', '${role.id}', 1)" ${!canHire1 ? 'disabled' : ''} class="btn-press py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  canHire1 ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }">
                  <span>+1 Rekrut</span>
                </button>
                <button onclick="game.hireTechEmployee('${biz.instanceId}', '${role.id}', 5)" ${!canHire5 ? 'disabled' : ''} class="btn-press py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  canHire5 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }">
                  <span>+5 Rekrut</span>
                </button>
                <button onclick="game.fireTechEmployee('${biz.instanceId}', '${role.id}', 1)" ${!canFire1 ? 'disabled' : ''} class="btn-press py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                  canFire1 ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40' : 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-slate-800'
                }">
                  <span>PHK -1</span>
                </button>
              </div>
            </div>
          `;
        }).join('');

        techTabContent = `
          <!-- Kapasitas Workstation & Total Gaji -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Penggunaan Workstation:</span>
                <span class="font-black text-white text-sm">${totalEmployees} / ${workstations} Meja Terisi</span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Total Beban Gaji Tim:</span>
                <span class="font-mono font-black text-rose-400 text-sm">-${this.formatMoney(hourlySalary)}/jam</span>
              </div>
            </div>

            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div class="h-full ${occPercent >= 100 ? 'bg-rose-500' : 'bg-emerald-400'} rounded-full transition-all" style="width: ${occPercent}%"></div>
            </div>

            <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
              <div class="font-bold flex items-center gap-1">
                <span>⚠️</span> Aturan Penggajian Software House:
              </div>
              <div class="text-slate-300 text-[10px] leading-relaxed">
                Gaji karyawan dipotong otomatis setiap jam game terlepas dari sedang ada proyek aktif atau selesai. Pastikan kas Anda terjaga dan rutin ambil proyek bernilai tinggi! Jika meja kerja penuh, perluas kantor di tab <strong>Kantor & Workstation</strong>.
              </div>
            </div>
          </div>

          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Daftar Divisi & Karyawan</h4>
            <p class="text-[11px] text-slate-400">Atur formasi tim ahli Anda untuk memenuhi persyaratan kontrak proyek bernilai besar.</p>
          </div>

          <div class="space-y-3">
            ${rolesHtml}
          </div>
        `;
      }

      // SUB-TAB 3: KANTOR & WORKSTATION (SMALL / STANDARD / BUSINESS CENTER)
      else if (this.detailSubTab === 'office') {
        let officeRenovationHtml = '';
        if (isOfficeUpgrading) {
          const remSec = Math.max(0, Math.ceil((biz.officeUpgradeEndTime - Date.now()) / 1000));
          const startTime = biz.officeUpgradeStartTime || Date.now();
          const endTime = biz.officeUpgradeEndTime || (Date.now() + 1000);
          const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

          officeRenovationHtml = `
            <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs shadow-lg space-y-2 mb-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-amber-300 flex items-center gap-1.5">
                  <span class="upgrade-pulsing-badge">🏗️</span> Renovasi Perluasan Kantor Berjalan
                </span>
                <span data-biz-timer="${biz.officeUpgradeEndTime}" class="font-mono font-bold text-amber-400">
                  ${this.formatDuration(remSec)}
                </span>
              </div>
              <div class="bg-slate-950/70 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-white">Target: +${biz.officeUpgradeAddedWorkstations} Workstation</div>
                  <div class="text-[10px] text-slate-400">Total baru: ${biz.officeUpgradeTargetWorkstations} Workstation</div>
                </div>
                <span class="text-amber-400 font-bold text-[10px] uppercase">Pengerjaan Kontraktor</span>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-amber-400 progress-striped" style="width: ${progress}%"></div>
              </div>
              <div class="text-[10px] text-slate-400 text-center">Tukang bangunan sedang memasang cubicle meja kerja & instalasi LAN/Server...</div>
            </div>
          `;
        }

        const officeTypesHtml = TECH_OFFICE_TYPES.map(type => {
          const canAfford = this.state.cash >= type.cost;

          let btnHtml = '';
          if (isOfficeUpgrading) {
            btnHtml = `
              <button disabled class="w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700/50">
                Renovasi Lain Sedang Dikerjakan
              </button>
            `;
          } else if (!canAfford) {
            btnHtml = `
              <button disabled class="w-full py-2.5 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs cursor-not-allowed border border-rose-500/20">
                Dana Tidak Cukup (${this.formatCompact(type.cost)})
              </button>
            `;
          } else {
            btnHtml = `
              <button onclick="game.upgradeOffice('${biz.instanceId}', '${type.id}')" class="btn-press w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5">
                <span>🏢 Beli Perluasan (+${type.addedWorkstations} Meja) • ${this.formatCompact(type.cost)}</span>
              </button>
            `;
          }

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5 hover:border-blue-500/40 transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${type.icon}</span>
                  <div>
                    <h5 class="font-bold text-white text-xs">${type.name}</h5>
                    <div class="text-[10px] text-slate-400">${type.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${type.addedWorkstations} Meja</span>
                  <div class="text-[10px] text-amber-400 font-mono">⏱️ ${this.formatDuration(type.durationSeconds)}</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <span class="text-slate-400">Biaya Investasi: <strong class="text-white">${this.formatMoney(type.cost)}</strong></span>
                <span class="text-slate-400">Total Baru: <strong class="text-emerald-300 font-mono">${workstations + type.addedWorkstations} Meja</strong></span>
              </div>

              ${btnHtml}
            </div>
          `;
        }).join('');

        techTabContent = `
          ${officeRenovationHtml}

          <!-- Info Kantor Saat Ini -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Total Workstation Saat Ini:</span>
                <span class="font-black text-white text-sm">${workstations} Workstations</span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Sisa Meja Kosong:</span>
                <span class="font-mono font-black text-emerald-400 text-sm">${Math.max(0, workstations - totalEmployees)} Meja</span>
              </div>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              Setiap upgrade kantor menambahkan kapasitas workstation secara permanen. Durasi pengerjaan dihitung berdasarkan waktu dunia nyata (minimal 14 menit).
            </p>
          </div>

          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Pilihan Upgrade Ruang Kantor</h4>
            <p class="text-[11px] text-slate-400">Pilih tipe kantor yang ingin Anda sewa dan renovasi untuk menampung lebih banyak developer.</p>
          </div>

          <div class="space-y-3">
            ${officeTypesHtml}
          </div>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button onclick="game.setDetailSubTab('projects')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'projects' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>📂 Proyek</span>
              ${isProjectReady ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-slate-950 font-black animate-pulse">Klaim</span>` : (isProjectRunning ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500 text-white font-bold">1</span>` : '')}
            </button>
            <button onclick="game.setDetailSubTab('team')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'team' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>👥 Tim (${totalEmployees}/${workstations})</span>
            </button>
            <button onclick="game.setDetailSubTab('office')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'office' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>🏢 Kantor</span>
              ${isOfficeUpgrading ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-black animate-pulse">Renov</span>` : ''}
            </button>
          </div>

          <!-- Konten Sub-Tab Aktif -->
          <div>
            ${techTabContent}
          </div>
        </div>
      `;
    }

    // DETAIL: MASKAPAI PENERBANGAN KOMERSIAL (AIRLINE)
    else if (sector.isAirline || biz.sectorId === 'airline') {
      if (!['routes', 'fleet', 'maintenance'].includes(this.detailSubTab)) {
        this.detailSubTab = 'routes';
      }

      const stats = this.getAirlineOperatingStats(biz);
      const isRouteUnlocking = !!biz.routeUnlockInProgress;

      let airlineTabContent = '';

      // SUB-TAB 1: RUTE PENERBANGAN INTERNASIONAL
      if (this.detailSubTab === 'routes') {
        let routeUnlockBannerHtml = '';
        if (isRouteUnlocking) {
          const remSec = Math.max(0, Math.ceil((biz.routeUnlockInProgress.endTime - Date.now()) / 1000));
          const startTime = biz.routeUnlockInProgress.startTime || Date.now();
          const endTime = biz.routeUnlockInProgress.endTime || (Date.now() + 1000);
          const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

          routeUnlockBannerHtml = `
            <div class="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/40 text-xs shadow-lg space-y-2 mb-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-blue-300 flex items-center gap-1.5">
                  <span class="upgrade-pulsing-badge">🛫</span> Negosiasi Hak Slot Terbang Sedang Berjalan
                </span>
                <span data-biz-timer="${biz.routeUnlockInProgress.endTime}" class="font-mono font-bold text-blue-400">
                  ${this.formatDuration(remSec)}
                </span>
              </div>
              <div class="bg-slate-950/70 p-2.5 rounded-xl border border-blue-500/20 flex items-center justify-between text-xs">
                <div>
                  <div class="font-bold text-white">${biz.routeUnlockInProgress.destination}</div>
                  <div class="text-[10px] text-slate-400">Verifikasi dokumen kelaikan & slot pendaratan bandara tujuan</div>
                </div>
                <span class="text-blue-400 font-bold text-[10px] uppercase">Otoritas Penerbangan</span>
              </div>
              <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 progress-striped rounded-full" style="width: ${progress}%"></div>
              </div>
            </div>
          `;
        }

        // Render Catalog of 10 Routes
        const routesListHtml = AIRLINE_ROUTES_CATALOG.map((route, idx) => {
          const isOpen = (biz.routes || []).includes(route.id);
          const catInfo = AIRCRAFT_CATEGORIES[route.requiredCategory] || { name: route.requiredCategory, shortName: route.requiredCategory, icon: '✈️' };

          // Detail for open route
          const rDetail = stats.routeDetails.find(rd => rd.route.id === route.id);

          // Planes matching category
          const planes = biz.planes || [];
          const matchingPlanes = planes.filter(p => {
            const m = AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId);
            return m && m.category === route.requiredCategory;
          });
          const usedMatchingCount = (biz.routes || []).filter(rId => {
            const r = AIRLINE_ROUTES_CATALOG.find(x => x.id === rId);
            return r && r.requiredCategory === route.requiredCategory;
          }).length;
          const hasAvailablePlane = matchingPlanes.length > usedMatchingCount;
          const canAffordUnlock = this.state.cash >= route.unlockCost;

          if (isOpen) {
            const plane = rDetail ? rDetail.plane : null;
            const planeModel = plane ? AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === plane.modelId) : null;
            const isOperating = rDetail && rDetail.isOperating;
            const isGrounded = rDetail && rDetail.reason === 'grounded';

            return `
              <div class="glass-panel p-3.5 rounded-2xl border ${isOperating ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'} space-y-2.5 transition">
                <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <span class="text-2xl sm:text-3xl shrink-0">${route.flag}</span>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <h5 class="font-black text-white text-xs truncate">${idx + 1}. ${route.destination}</h5>
                        <span class="text-[9px] px-1.5 py-0.5 rounded-full font-black shrink-0 ${isOperating ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}">
                          ${isOperating ? '🟢 Mengudara' : (isGrounded ? '🔴 Grounded' : '⚠️ Tanpa Pesawat')}
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 truncate">Jarak: ${route.distanceKm.toLocaleString('id-ID')} km • CGK ⇄ ${route.destination.split('(')[1]?.split(')')[0] || 'DEST'}</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between sm:flex-col sm:items-end border-t border-slate-800/60 sm:border-0 pt-1.5 sm:pt-0">
                    <div class="text-xs font-mono font-black ${isOperating ? 'text-emerald-400' : 'text-rose-400'}">
                      ${isOperating ? '+' + this.formatMoney(route.hourlyRevenue) + '/jam' : 'Rp 0/jam'}
                    </div>
                    <div class="text-[10px] text-slate-400">${isOperating ? 'Omzet Tiket & Kargo' : 'Pesawat Tidak Terbang'}</div>
                  </div>
                </div>

                <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">${planeModel ? planeModel.icon : '❓'}</span>
                    <div>
                      <div class="font-bold text-white text-[11px]">${planeModel ? planeModel.name : 'Belum Ditugaskan'}</div>
                      <div class="text-[10px] text-slate-400">Kapasitas: ${planeModel ? planeModel.capacity + ' Kursi' : '-'} • Syarat: ${catInfo.name}</div>
                    </div>
                  </div>
                  ${isGrounded ? `
                    <button onclick="game.payAirlineMaintenance('${biz.instanceId}')" class="btn-press px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm">
                      🔧 Bayar Perawatan
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }

          // Rute Belum Dibuka
          let actionBtnHtml = '';
          if (isRouteUnlocking) {
            actionBtnHtml = `
              <button disabled class="w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700/50">
                Sedang Mengurus Izin Rute Lain
              </button>
            `;
          } else if (matchingPlanes.length === 0) {
            actionBtnHtml = `
              <button onclick="game.setDetailSubTab('fleet')" class="btn-press w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5">
                <span>⚠️ Butuh Pesawat ${catInfo.shortName} (Beli di Tab Armada →)</span>
              </button>
            `;
          } else if (!hasAvailablePlane) {
            actionBtnHtml = `
              <button onclick="game.setDetailSubTab('fleet')" class="btn-press w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5">
                <span>⚠️ Seluruh Pesawat ${catInfo.shortName} Terpakai (${matchingPlanes.length}/${usedMatchingCount}) (Beli Tambahan →)</span>
              </button>
            `;
          } else if (!canAffordUnlock) {
            actionBtnHtml = `
              <button disabled class="w-full py-2.5 rounded-xl bg-slate-800 text-rose-400 font-bold text-xs cursor-not-allowed border border-rose-500/20">
                Dana Izin Tidak Cukup (${this.formatCompact(route.unlockCost)})
              </button>
            `;
          } else {
            actionBtnHtml = `
              <button onclick="game.unlockAirlineRoute('${biz.instanceId}', '${route.id}')" class="btn-press w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5">
                <span>🛫 Buka Izin Rute & Terbangkan (${this.formatCompact(route.unlockCost)}) • ⏱️ ${this.formatDuration(route.durationSeconds)}</span>
              </button>
            `;
          }

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5 opacity-95 hover:border-blue-500/40 transition">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${route.flag}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-black text-white text-xs">${idx + 1}. ${route.destination}</h5>
                      <span class="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400">Terkunci</span>
                    </div>
                    <div class="text-[10px] text-slate-400">Jarak: ${route.distanceKm.toLocaleString('id-ID')} km • ${route.desc}</div>
                  </div>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-[10px] text-slate-400 block">Syarat Jenis Pesawat:</span>
                  <span class="font-bold text-white text-[11px] flex items-center gap-1">
                    <span>${catInfo.icon}</span> ${catInfo.name}
                  </span>
                  <span class="text-[10px] ${hasAvailablePlane ? 'text-emerald-400 font-bold' : 'text-rose-400'}">
                    Armada Tersedia: ${matchingPlanes.length - usedMatchingCount} Unit
                  </span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">Potensi Omzet Tiket:</span>
                  <span class="font-black text-emerald-400 font-mono">+${this.formatMoney(route.hourlyRevenue)}/jam</span>
                  <span class="text-[10px] text-amber-400 font-mono block">Biaya Izin: ${this.formatCompact(route.unlockCost)}</span>
                </div>
              </div>

              ${actionBtnHtml}
            </div>
          `;
        }).join('');

        airlineTabContent = `
          ${routeUnlockBannerHtml}

          <div class="mb-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Daftar Rute Penerbangan Internasional (10 Rute)</h4>
            <p class="text-[11px] text-slate-400">Buka slot penerbangan ke bandara negara lain. Setiap rute memerlukan armada pesawat yang sesuai dengan jarak tempuh & kapasitas penumpang.</p>
          </div>

          <div class="space-y-3">
            ${routesListHtml}
          </div>
        `;
      }

      // SUB-TAB 2: ARMADA PESAWAT & SHOWROOM
      else if (this.detailSubTab === 'fleet') {
        const ownedPlanes = biz.planes || [];

        const ownedPlanesHtml = ownedPlanes.map((plane, idx) => {
          const model = AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === plane.modelId);
          if (!model) return '';
          const catInfo = AIRCRAFT_CATEGORIES[model.category] || { name: model.category };
          const isGrounded = plane.isGrounded;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border ${isGrounded ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-800'} space-y-2">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${model.icon}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">#${idx + 1} ${model.name}</h5>
                      <span class="text-[9px] px-2 py-0.5 rounded-full font-black ${isGrounded ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'}">
                        ${isGrounded ? '🔴 Grounded' : '🟢 Mengudara'}
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400">${catInfo.name} • ${model.manufacturer}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-slate-400 block">Biaya Perawatan:</span>
                  <span class="text-xs font-mono font-bold text-rose-400">-${this.formatCompact(model.maintenanceCost)}/jam</span>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Kapasitas: <strong class="text-white">${model.capacity} Penumpang</strong></span>
                <span class="text-slate-400">Jangkauan: <strong class="text-white">${model.rangeKm.toLocaleString('id-ID')} km</strong></span>
                ${isGrounded ? `
                  <button onclick="game.payAirlineMaintenance('${biz.instanceId}')" class="btn-press px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                    Bayar Perawatan
                  </button>
                ` : `
                  <span class="text-emerald-400 font-bold">✓ Kelaikan Terpenuhi</span>
                `}
              </div>
            </div>
          `;
        }).join('');

        const showroomHtml = AIRLINE_AIRCRAFT_CATALOG.map(model => {
          const catInfo = AIRCRAFT_CATEGORIES[model.category] || { name: model.category };
          const canAfford = this.state.cash >= model.price;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5 hover:border-blue-500/40 transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${model.icon}</span>
                  <div>
                    <h5 class="font-bold text-white text-xs">${model.name}</h5>
                    <div class="text-[10px] text-slate-400">${catInfo.name} • ${model.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-white">${this.formatCompact(model.price)}</span>
                  <div class="text-[10px] text-rose-400 font-mono">Beban: -${this.formatCompact(model.maintenanceCost)}/j</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Kapasitas: <strong class="text-white">${model.capacity} Kursi</strong></span>
                <span class="text-slate-400">Jangkauan: <strong class="text-white">${model.rangeKm.toLocaleString('id-ID')} km</strong></span>
                <span class="text-slate-400">Pabrikan: <strong class="text-slate-300">${model.manufacturer}</strong></span>
              </div>

              <button onclick="game.buyAirlinePlane('${biz.instanceId}', '${model.id}')" ${!canAfford ? 'disabled' : ''} class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-rose-400 cursor-not-allowed border border-rose-500/20'
              }">
                <span>${canAfford ? `🛒 Beli Armada (${this.formatCompact(model.price)})` : `Dana Tidak Cukup (${this.formatCompact(model.price)})`}</span>
              </button>
            </div>
          `;
        }).join('');

        airlineTabContent = `
          <!-- Daftar Armada Pesawat Dimiliki -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Armada Pesawat Dimiliki (${ownedPlanes.length} Unit)</h4>
              <span class="text-[11px] font-mono text-emerald-400 font-bold">${stats.operatingPlanesCount} Terbang • ${stats.groundedPlanesCount} Grounded</span>
            </div>
            <div class="space-y-2.5">
              ${ownedPlanesHtml.length > 0 ? ownedPlanesHtml : '<div class="text-xs text-slate-400 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">Belum ada pesawat. Silakan beli armada di showroom bawah!</div>'}
            </div>
          </div>

          <!-- Showroom Pembelian Pesawat -->
          <div>
            <div class="mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Showroom Pembelian Pesawat Baru (8 Model)</h4>
              <p class="text-[11px] text-slate-400">Pilih armada sesuai kebutuhan rute (Jet Regional, Boeing Sedang, Wide-Body, atau Superjumbo Double Deck).</p>
            </div>
            <div class="space-y-3">
              ${showroomHtml}
            </div>
          </div>
        `;
      }

      // SUB-TAB 3: PEMELIHARAAN & KELAIKAN (MAINTENANCE)
      else if (this.detailSubTab === 'maintenance') {
        const isAllAirworthy = stats.groundedPlanesCount === 0;

        airlineTabContent = `
          <!-- Status Kelaikan Terbang (Airworthiness) -->
          <div class="p-3.5 rounded-2xl ${isAllAirworthy ? 'bg-emerald-500/10 border border-emerald-500/40' : 'bg-rose-500/10 border-2 border-rose-500'} space-y-2.5 mb-3">
            <div class="flex items-center justify-between">
              <span class="font-black text-sm flex items-center gap-1.5 ${isAllAirworthy ? 'text-emerald-400' : 'text-rose-400'}">
                <span>${isAllAirworthy ? '🛡️' : '🚨'}</span>
                ${isAllAirworthy ? 'Seluruh Armada Laik Terbang (100% Airworthy)' : `${stats.groundedPlanesCount} Pesawat Masuk Hangar (Grounded)!`}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded font-black uppercase ${isAllAirworthy ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}">
                ${isAllAirworthy ? 'Operasional Normal' : 'Butuh Servis'}
              </span>
            </div>

            <p class="text-[11px] text-slate-300 leading-relaxed">
              ${isAllAirworthy
                ? 'Seluruh pesawat telah mendapatkan inspeksi kelaikan terbang berkala. Rute penerbangan beroperasi normal dan menghasilkan pendapatan penuh setiap jam.'
                : 'Pesawat yang menunggak biaya perawatan di-grounded oleh otoritas penerbangan demi keselamatan penumpang. Seluruh rute yang terdampak tidak akan menghasilkan uang sampai biaya perawatan dilunasi.'
              }
            </p>

            ${!isAllAirworthy ? `
              <button onclick="game.payAirlineMaintenance('${biz.instanceId}')" class="btn-press w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                <span>💳 Bayar Lunas Perawatan Seluruh Armada (${this.formatMoney(stats.totalMaintenanceCost)})</span>
              </button>
            ` : ''}
          </div>

          <!-- Pengaturan Otomatis Bayar Perawatan -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mb-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="font-bold text-white text-xs">Sistem Auto-Debet Perawatan Armada</span>
                <div class="text-[10px] text-slate-400">Potong biaya perawatan otomatis setiap jam game agar pesawat tidak pernah grounded.</div>
              </div>
              <button onclick="game.toggleAirlineAutoMaintenance('${biz.instanceId}')" class="btn-press px-3 py-1.5 rounded-xl font-black text-xs ${
                biz.autoMaintenance !== false
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }">
                ${biz.autoMaintenance !== false ? '✓ Aktif' : 'Nonaktif'}
              </button>
            </div>
          </div>

          <!-- Ringkasan Biaya Pemeliharaan -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Ringkasan Beban Pemeliharaan</h4>
            <div class="flex justify-between items-center text-xs pb-1.5 border-b border-slate-800/80">
              <span class="text-slate-400">Total Armada Pesawat:</span>
              <span class="font-bold text-white">${stats.totalPlanes} Unit Pesawat</span>
            </div>
            <div class="flex justify-between items-center text-xs pb-1.5 border-b border-slate-800/80">
              <span class="text-slate-400">Total Biaya Perawatan:</span>
              <span class="font-mono font-black text-rose-400">-${this.formatMoney(stats.totalMaintenanceCost)}/jam</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-400">Estimasi Laba Bersih Maskapai:</span>
              <span class="font-mono font-black text-emerald-400">+${this.formatMoney(stats.netRevenue)}/jam</span>
            </div>
          </div>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Overview Card -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Armada Pesawat:</span>
                <span class="font-black text-white text-sm">${stats.operatingPlanesCount} / ${stats.totalPlanes} Pesawat Mengudara</span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Laba Bersih Maskapai:</span>
                <span class="font-mono font-black ${stats.netRevenue > 0 ? 'text-emerald-400' : 'text-slate-400'} text-sm">
                  ${stats.netRevenue > 0 ? '+' + this.formatMoney(stats.netRevenue) + '/jam' : 'Rp 0/jam'}
                </span>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Omzet Tiket: +${this.formatCompact(stats.grossRevenue)}/j</span>
              <span class="text-rose-400">Beban Servis: -${this.formatCompact(stats.totalMaintenanceCost)}/j</span>
              <span class="text-blue-300">${stats.operatingRoutesCount} Rute Aktif</span>
            </div>
          </div>

          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button onclick="game.setDetailSubTab('routes')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'routes' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>🌐 Rute (${stats.openRoutesCount}/10)</span>
              ${isRouteUnlocking ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500 text-white font-bold animate-pulse">Izin</span>` : ''}
            </button>
            <button onclick="game.setDetailSubTab('fleet')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'fleet' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>✈️ Armada (${stats.totalPlanes})</span>
            </button>
            <button onclick="game.setDetailSubTab('maintenance')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'maintenance' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>🔧 Kelaikan</span>
              ${stats.groundedPlanesCount > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold animate-pulse">${stats.groundedPlanesCount} Grounded</span>` : ''}
            </button>
          </div>

          <!-- Konten Sub-Tab Aktif -->
          <div>
            ${airlineTabContent}
          </div>
        </div>
      `;
    }

    // DETAIL: INDUSTRI MINYAK & GAS (OIL & GAS)
    else if (sector.isOil || biz.sectorId === 'oil') {
      if (!['contracts', 'facilities'].includes(this.detailSubTab)) {
        this.detailSubTab = 'contracts';
      }

      const stats = this.getOilProductionStats(biz);
      const signedContracts = biz.contracts || [];
      const signedCount = signedContracts.length;
      const isSigning = !!biz.contractSigningInProgress;
      const nextContract = signedCount < OIL_CONTRACTS_CATALOG.length ? OIL_CONTRACTS_CATALOG[signedCount] : null;

      let oilTabContent = '';

      if (this.detailSubTab === 'contracts') {
        // 1. Signed Contracts List
        const signedContractsHtml = signedContracts.map((cId, idx) => {
          const cDef = OIL_CONTRACTS_CATALOG.find(c => c.id === cId);
          if (!cDef) return '';
          return `
            <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2 mb-2.5">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${cDef.badge || '🛢️'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">${cDef.title}</h5>
                      <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">#${idx + 1} Aktif</span>
                    </div>
                    <div class="text-[10px] text-slate-400">Mitra: <strong class="text-slate-300">${cDef.partner}</strong> (${cDef.country})</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${this.formatCompact(cDef.revenuePerHour)}/jam</span>
                  <div class="text-[10px] text-slate-400">Suplai Rutin</div>
                </div>
              </div>
              <div class="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                <span>Pasokan: <strong>${cDef.reqOilBbl.toLocaleString('id-ID')} Bbl/j</strong> & <strong>${cDef.reqGasBoe.toLocaleString('id-ID')} BOE/j</strong></span>
                <span class="text-emerald-400 font-bold">✓ Kontrak Sah</span>
              </div>
            </div>
          `;
        }).join('');

        // 2. Next Target Contract Card (HANYA SATU KONTRAK BERIKUTNYA, TIDAK DI-LIST SEMUANYA)
        let nextContractHtml = '';
        if (nextContract) {
          const reqOilMet = stats.totalOilBblPerHour >= nextContract.reqOilBbl;
          const reqGasMet = stats.totalGasBoePerHour >= nextContract.reqGasBoe;
          const oilPct = Math.min(100, Math.round((stats.totalOilBblPerHour / nextContract.reqOilBbl) * 100));
          const gasPct = Math.min(100, Math.round((stats.totalGasBoePerHour / nextContract.reqGasBoe) * 100));
          const canAffordFee = this.state.cash >= nextContract.tenderFee;
          const allReqsMet = reqOilMet && reqGasMet && canAffordFee;

          nextContractHtml = `
            <div class="glass-panel p-4 rounded-2xl border-2 ${allReqsMet ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10' : 'border-slate-800 bg-slate-950/80'} space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${nextContract.badge || '📑'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Target Kontrak #${signedCount + 1}</span>
                    </div>
                    <h5 class="font-extrabold text-white text-sm">${nextContract.title}</h5>
                    <div class="text-[11px] text-slate-300">Mitra: <strong class="text-white">${nextContract.partner}</strong> (${nextContract.country})</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${this.formatMoney(nextContract.revenuePerHour)}/jam</span>
                  <div class="text-[10px] text-slate-400">Tambahan Cuan</div>
                </div>
              </div>

              <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                ${nextContract.desc}
              </p>

              <!-- Syarat Kuota Pasokan -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">1. Kuota Minyak Bumi:</span>
                  <span class="font-mono font-bold ${reqOilMet ? 'text-emerald-400' : 'text-amber-400'}">
                    ${stats.totalOilBblPerHour.toLocaleString('id-ID')} / ${nextContract.reqOilBbl.toLocaleString('id-ID')} Bbl/jam ${reqOilMet ? '✓' : ''}
                  </span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full ${reqOilMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${oilPct}%"></div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <span class="text-slate-400">2. Kuota Gas Bumi:</span>
                  <span class="font-mono font-bold ${reqGasMet ? 'text-emerald-400' : 'text-amber-400'}">
                    ${stats.totalGasBoePerHour.toLocaleString('id-ID')} / ${nextContract.reqGasBoe.toLocaleString('id-ID')} BOE/jam ${reqGasMet ? '✓' : ''}
                  </span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full ${reqGasMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${gasPct}%"></div>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">Biaya Administrasi & Tender:</span>
                  <span class="font-mono font-bold ${canAffordFee ? 'text-white' : 'text-rose-400'}">${this.formatMoney(nextContract.tenderFee)}</span>
                </div>
                <div class="flex justify-between items-center text-[11px]">
                  <span class="text-slate-400">Durasi Negosiasi & Legalisasi:</span>
                  <span class="font-mono font-bold text-amber-400">⏱️ ${this.formatDuration(nextContract.durationSeconds)}</span>
                </div>
              </div>

              ${isSigning ? `
                <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-amber-300 font-bold flex items-center gap-1.5">
                      <span class="upgrade-pulsing-badge">📜</span>
                      Proses Tender & Negosiasi Sedang Berjalan...
                    </span>
                    <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.contractSigningInProgress.endTime}">
                      ${this.formatDuration(Math.max(0, Math.ceil((biz.contractSigningInProgress.endTime - Date.now()) / 1000)))}
                    </span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.contractSigningInProgress.startTime}" data-biz-end="${biz.contractSigningInProgress.endTime}"></div>
                  </div>
                  <div class="text-[10px] text-slate-400 text-center">Tim legal dan perwakilan mitra sedang memfinalisasi kontrak kerja sama pasokan...</div>
                </div>
              ` : `
                <button onclick="game.signOilContract('${biz.instanceId}')" ${!allReqsMet ? 'disabled' : ''} class="btn-press w-full py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  allReqsMet
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                }">
                  <span>${
                    !reqOilMet || !reqGasMet
                      ? '⚠️ Kuota Produksi Belum Cukup (Beli Fasilitas di Tab Fasilitas)'
                      : (!canAffordFee ? '⚠️ Saldo Kas Tidak Cukup untuk Biaya Tender' : `📑 Ajukan Tender & Teken Kontrak (${this.formatDuration(nextContract.durationSeconds)})`)
                  }</span>
                </button>
              `}
            </div>
          `;
        } else {
          nextContractHtml = `
            <div class="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-center space-y-2 shadow-lg shadow-emerald-500/10">
              <div class="text-3xl">👑</div>
              <h4 class="font-black text-white text-sm">Seluruh Kontrak Migas Strategis Diteken!</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Selamat! Perusahaan minyak & gas Anda telah mengamankan seluruh 8 kontrak pasokan energi dengan konglomerat multinasional terkemuka di dunia.
              </p>
            </div>
          `;
        }

        oilTabContent = `
          <!-- Kontrak Berikutnya yang Harus Dicapai -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Target Kontrak Baru (${signedCount}/${OIL_CONTRACTS_CATALOG.length})</h4>
              <span class="text-[11px] text-slate-400">1 Kontrak Muncul Bertahap</span>
            </div>
            ${nextContractHtml}
          </div>

          <!-- Daftar Kontrak Aktif -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Kontrak Pasokan Aktif (${signedCount})</h4>
              <span class="text-[11px] font-mono text-emerald-400 font-bold">+${this.formatCompact(stats.totalContractRevenue)}/jam</span>
            </div>
            ${signedContracts.length > 0 ? signedContractsHtml : '<div class="text-xs text-slate-400 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">Belum ada kontrak aktif. Penuhi kuota target di atas dan ajukan tender pertama Anda!</div>'}
          </div>
        `;
      } else if (this.detailSubTab === 'facilities') {
        const totalUnits = (biz.facilities || []).reduce((acc, f) => acc + (f.count || 0), 0);

        const facilitiesHtml = OIL_FACILITIES_CATALOG.map(fac => {
          const owned = (biz.facilities || []).find(f => f.id === fac.id);
          const count = owned ? (owned.count || 0) : 0;
          const canAfford = this.state.cash >= fac.cost;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5 hover:border-amber-500/40 transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${fac.icon}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">${fac.name}</h5>
                      <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${count > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}">${count} Unit</span>
                    </div>
                    <div class="text-[10px] text-slate-400">${fac.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-white">${this.formatCompact(fac.cost)}</span>
                  <div class="text-[10px] text-slate-400">Biaya Bangun</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Output: <strong class="text-amber-400">+${fac.oilBblPerHour.toLocaleString('id-ID')} Bbl/j</strong></span>
                <span class="text-slate-400">Gas: <strong class="text-blue-400">+${fac.gasBoePerHour.toLocaleString('id-ID')} BOE/j</strong></span>
                <span class="text-slate-400">Total Dimiliki: <strong class="text-white">${count}x</strong></span>
              </div>

              <button onclick="game.buyOilFacility('${biz.instanceId}', '${fac.id}')" ${!canAfford ? 'disabled' : ''} class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                canAfford
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              }">
                <span>${canAfford ? `🏗️ Bangun Fasilitas (${this.formatCompact(fac.cost)})` : `Dana Tidak Cukup (${this.formatCompact(fac.cost)})`}</span>
              </button>
            </div>
          `;
        }).join('');

        oilTabContent = `
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Katalog Fasilitas Hulu Migas (${OIL_FACILITIES_CATALOG.length} Fasilitas)</h4>
              <span class="text-[11px] text-amber-400 font-bold">${totalUnits} Fasilitas Aktif</span>
            </div>
            <p class="text-[11px] text-slate-400">Bangun fasilitas produksi untuk memperbesar kuota barel minyak dan BOE gas per jam agar lolos tender kontrak pasokan berikutnya.</p>
          </div>
          <div class="space-y-3">
            ${facilitiesHtml}
          </div>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Overview Card -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Total Kapasitas Produksi:</span>
                <span class="font-black text-white text-sm">
                  🛢️ ${stats.totalOilBblPerHour.toLocaleString('id-ID')} Bbl/j • 💨 ${stats.totalGasBoePerHour.toLocaleString('id-ID')} BOE/j
                </span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Total Pendapatan:</span>
                <span class="font-mono font-black text-emerald-400 text-sm">
                  +${this.formatMoney(stats.totalHourlyRevenue)}/jam
                </span>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Dasar Bisnis: +${this.formatCompact(BUSINESS_SECTORS.find(s => s.sectorId === 'oil')?.baseRevenue || 1200000000)}/j</span>
              <span class="text-emerald-400">Kontrak Pasokan: +${this.formatCompact(stats.totalContractRevenue)}/j</span>
              <span class="text-amber-300 font-bold">${signedCount}/${OIL_CONTRACTS_CATALOG.length} Kontrak</span>
            </div>
          </div>

          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button onclick="game.setDetailSubTab('contracts')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'contracts' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>📜 Kontrak Suplai (${signedCount}/${OIL_CONTRACTS_CATALOG.length})</span>
              ${isSigning ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-bold animate-pulse">Tender</span>` : ''}
            </button>
            <button onclick="game.setDetailSubTab('facilities')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'facilities' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>🏭 Fasilitas Produksi</span>
            </button>
          </div>

          <!-- Konten Sub-Tab Aktif -->
          <div>
            ${oilTabContent}
          </div>
        </div>
      `;
    }

    // DETAIL: PERUSAHAAN TAMBANG MINERAL (MINING)
    else if (sector.isMining || biz.sectorId === 'mining') {
      if (!['contracts', 'facilities'].includes(this.detailSubTab)) {
        this.detailSubTab = 'contracts';
      }

      const stats = this.getMiningProductionStats(biz);
      const signedContracts = biz.contracts || [];
      const signedCount = signedContracts.length;
      const isSigning = !!biz.contractSigningInProgress;
      const nextContract = signedCount < MINING_CONTRACTS_CATALOG.length ? MINING_CONTRACTS_CATALOG[signedCount] : null;

      let miningTabContent = '';

      if (this.detailSubTab === 'contracts') {
        // 1. Signed Contracts List
        const signedContractsHtml = signedContracts.map((cId, idx) => {
          const cDef = MINING_CONTRACTS_CATALOG.find(c => c.id === cId);
          if (!cDef) return '';
          return `
            <div class="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-2 mb-2.5">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">${cDef.badge || '⛏️'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">${cDef.title}</h5>
                      <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">#${idx + 1} Aktif</span>
                    </div>
                    <div class="text-[10px] text-slate-400">Mitra: <strong class="text-slate-300">${cDef.partner}</strong> (${cDef.country})</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${this.formatCompact(cDef.revenuePerHour)}/jam</span>
                  <div class="text-[10px] text-slate-400">Suplai Rutin</div>
                </div>
              </div>
              <div class="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                <span>Pasokan: <strong>${cDef.reqNickelTon.toLocaleString('id-ID')} Ton/j</strong> & <strong>${cDef.reqGoldKg.toLocaleString('id-ID')} Kg/j</strong></span>
                <span class="text-emerald-400 font-bold">✓ Kontrak Sah</span>
              </div>
            </div>
          `;
        }).join('');

        // 2. Next Target Contract Card (HANYA SATU KONTRAK BERIKUTNYA, TIDAK DI-LIST SEMUANYA)
        let nextContractHtml = '';
        if (nextContract) {
          const reqNickelMet = stats.totalNickelTonPerHour >= nextContract.reqNickelTon;
          const reqGoldMet = stats.totalGoldKgPerHour >= nextContract.reqGoldKg;
          const nickelPct = Math.min(100, Math.round((stats.totalNickelTonPerHour / nextContract.reqNickelTon) * 100));
          const goldPct = Math.min(100, Math.round((stats.totalGoldKgPerHour / nextContract.reqGoldKg) * 100));
          const canAffordFee = this.state.cash >= nextContract.tenderFee;
          const allReqsMet = reqNickelMet && reqGoldMet && canAffordFee;

          nextContractHtml = `
            <div class="glass-panel p-4 rounded-2xl border-2 ${allReqsMet ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/10 to-transparent shadow-lg shadow-amber-500/10' : 'border-slate-800 bg-slate-950/80'} space-y-3">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${nextContract.badge || '📑'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400">Target Kontrak #${signedCount + 1}</span>
                    </div>
                    <h5 class="font-extrabold text-white text-sm">${nextContract.title}</h5>
                    <div class="text-[11px] text-slate-300">Mitra: <strong class="text-white">${nextContract.partner}</strong> (${nextContract.country})</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-emerald-400">+${this.formatMoney(nextContract.revenuePerHour)}/jam</span>
                  <div class="text-[10px] text-slate-400">Tambahan Cuan</div>
                </div>
              </div>

              <p class="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                ${nextContract.desc}
              </p>

              <!-- Syarat Kuota Pasokan Mineral -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-slate-400">1. Kuota Konsentrat Nikel:</span>
                  <span class="font-mono font-bold ${reqNickelMet ? 'text-emerald-400' : 'text-amber-400'}">
                    ${stats.totalNickelTonPerHour.toLocaleString('id-ID')} / ${nextContract.reqNickelTon.toLocaleString('id-ID')} Ton/jam ${reqNickelMet ? '✓' : ''}
                  </span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full ${reqNickelMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${nickelPct}%"></div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <span class="text-slate-400">2. Kuota Emas Murni:</span>
                  <span class="font-mono font-bold ${reqGoldMet ? 'text-emerald-400' : 'text-amber-400'}">
                    ${stats.totalGoldKgPerHour.toLocaleString('id-ID')} / ${nextContract.reqGoldKg.toLocaleString('id-ID')} Kg/jam ${reqGoldMet ? '✓' : ''}
                  </span>
                </div>
                <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div class="h-full ${reqGoldMet ? 'bg-emerald-400' : 'bg-amber-400'} transition-all" style="width: ${goldPct}%"></div>
                </div>
              </div>

              <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                <div class="flex justify-between items-center">
                  <span class="text-slate-400">Biaya Administrasi & Tender:</span>
                  <span class="font-mono font-bold ${canAffordFee ? 'text-white' : 'text-rose-400'}">${this.formatMoney(nextContract.tenderFee)}</span>
                </div>
                <div class="flex justify-between items-center text-[11px]">
                  <span class="text-slate-400">Durasi Negosiasi & Legalisasi:</span>
                  <span class="font-mono font-bold text-amber-400">⏱️ ${this.formatDuration(nextContract.durationSeconds)}</span>
                </div>
              </div>

              ${isSigning ? `
                <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-amber-300 font-bold flex items-center gap-1.5">
                      <span class="upgrade-pulsing-badge">📜</span>
                      Proses Tender & Negosiasi Sedang Berjalan...
                    </span>
                    <span class="font-mono font-bold text-amber-400" data-biz-timer="${biz.contractSigningInProgress.endTime}">
                      ${this.formatDuration(Math.max(0, Math.ceil((biz.contractSigningInProgress.endTime - Date.now()) / 1000)))}
                    </span>
                  </div>
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="h-full bg-amber-400 progress-striped rounded-full" data-biz-progress data-biz-start="${biz.contractSigningInProgress.startTime}" data-biz-end="${biz.contractSigningInProgress.endTime}"></div>
                  </div>
                  <div class="text-[10px] text-slate-400 text-center">Pihak auditor dan mitra industri sedang memverifikasi kapasitas tambang...</div>
                </div>
              ` : `
                <button onclick="game.signMiningContract('${biz.instanceId}')" ${!allReqsMet ? 'disabled' : ''} class="btn-press w-full py-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                  allReqsMet
                    ? 'bg-gradient-to-r from-amber-500 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                }">
                  <span>${
                    !reqNickelMet || !reqGoldMet
                      ? '⚠️ Kuota Produksi Belum Cukup (Beli Fasilitas di Tab Fasilitas)'
                      : (!canAffordFee ? '⚠️ Saldo Kas Tidak Cukup untuk Biaya Tender' : `📑 Ajukan Tender & Teken Kontrak (${this.formatDuration(nextContract.durationSeconds)})`)
                  }</span>
                </button>
              `}
            </div>
          `;
        } else {
          nextContractHtml = `
            <div class="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-center space-y-2 shadow-lg shadow-emerald-500/10">
              <div class="text-3xl">👑</div>
              <h4 class="font-black text-white text-sm">Seluruh Kontrak Tambang Mineral Diteken!</h4>
              <p class="text-xs text-slate-300 leading-relaxed">
                Selamat! Perusahaan tambang Anda telah mengamankan seluruh 8 kontrak pasokan komoditas strategis dengan raksasa manufaktur dan perbankan sentral dunia.
              </p>
            </div>
          `;
        }

        miningTabContent = `
          <!-- Kontrak Berikutnya yang Harus Dicapai -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Target Kontrak Baru (${signedCount}/${MINING_CONTRACTS_CATALOG.length})</h4>
              <span class="text-[11px] text-slate-400">1 Kontrak Muncul Bertahap</span>
            </div>
            ${nextContractHtml}
          </div>

          <!-- Daftar Kontrak Aktif -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Kontrak Pasokan Aktif (${signedCount})</h4>
              <span class="text-[11px] font-mono text-emerald-400 font-bold">+${this.formatCompact(stats.totalContractRevenue)}/jam</span>
            </div>
            ${signedContracts.length > 0 ? signedContractsHtml : '<div class="text-xs text-slate-400 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">Belum ada kontrak aktif. Penuhi kuota target di atas dan ajukan tender pertama Anda!</div>'}
          </div>
        `;
      } else if (this.detailSubTab === 'facilities') {
        const totalUnits = (biz.facilities || []).reduce((acc, f) => acc + (f.count || 0), 0);

        const facilitiesHtml = MINING_FACILITIES_CATALOG.map(fac => {
          const owned = (biz.facilities || []).find(f => f.id === fac.id);
          const count = owned ? (owned.count || 0) : 0;
          const canAfford = this.state.cash >= fac.cost;

          return `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2.5 hover:border-amber-500/40 transition">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-2.5">
                  <span class="text-3xl">${fac.icon}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <h5 class="font-bold text-white text-xs">${fac.name}</h5>
                      <span class="text-[9px] px-1.5 py-0.2 rounded font-bold ${count > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}">${count} Unit</span>
                    </div>
                    <div class="text-[10px] text-slate-400">${fac.desc}</div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-xs font-mono font-black text-white">${this.formatCompact(fac.cost)}</span>
                  <div class="text-[10px] text-slate-400">Biaya Pengadaan</div>
                </div>
              </div>

              <div class="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Nikel: <strong class="text-amber-400">+${fac.nickelTonPerHour.toLocaleString('id-ID')} Ton/j</strong></span>
                <span class="text-slate-400">Emas: <strong class="text-yellow-400">+${fac.goldKgPerHour.toLocaleString('id-ID')} Kg/j</strong></span>
                <span class="text-slate-400">Total Dimiliki: <strong class="text-white">${count}x</strong></span>
              </div>

              <button onclick="game.buyMiningFacility('${biz.instanceId}', '${fac.id}')" ${!canAfford ? 'disabled' : ''} class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
                canAfford
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              }">
                <span>${canAfford ? `⛏️ Bangun Fasilitas (${this.formatCompact(fac.cost)})` : `Dana Tidak Cukup (${this.formatCompact(fac.cost)})`}</span>
              </button>
            </div>
          `;
        }).join('');

        miningTabContent = `
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <h4 class="text-xs uppercase tracking-wider font-extrabold text-slate-400">Katalog Fasilitas Tambang & Pemurnian (${MINING_FACILITIES_CATALOG.length} Fasilitas)</h4>
              <span class="text-[11px] text-amber-400 font-bold">${totalUnits} Fasilitas Aktif</span>
            </div>
            <p class="text-[11px] text-slate-400">Pengadaan armada ekskavator, shaft drilling, dan smelter pemurnian untuk melipatgandakan output nikel & emas per jam demi memenuhi kontrak suplai.</p>
          </div>
          <div class="space-y-3">
            ${facilitiesHtml}
          </div>
        `;
      }

      specificSectionHtml = `
        <div class="space-y-3">
          <!-- Overview Card -->
          <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[11px] text-slate-400 block font-semibold">Total Kapasitas Produksi:</span>
                <span class="font-black text-white text-sm">
                  ⛏️ ${stats.totalNickelTonPerHour.toLocaleString('id-ID')} Ton/j • 🪙 ${stats.totalGoldKgPerHour.toLocaleString('id-ID')} Kg/j
                </span>
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block font-semibold">Total Pendapatan:</span>
                <span class="font-mono font-black text-emerald-400 text-sm">
                  +${this.formatMoney(stats.totalHourlyRevenue)}/jam
                </span>
              </div>
            </div>
            <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>Dasar Bisnis: +${this.formatCompact(BUSINESS_SECTORS.find(s => s.sectorId === 'mining')?.baseRevenue || 2500000000)}/j</span>
              <span class="text-emerald-400">Kontrak Pasokan: +${this.formatCompact(stats.totalContractRevenue)}/j</span>
              <span class="text-amber-300 font-bold">${signedCount}/${MINING_CONTRACTS_CATALOG.length} Kontrak</span>
            </div>
          </div>

          <!-- Sub-Tab Switcher -->
          <div class="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button onclick="game.setDetailSubTab('contracts')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'contracts' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>📜 Kontrak Suplai (${signedCount}/${MINING_CONTRACTS_CATALOG.length})</span>
              ${isSigning ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-bold animate-pulse">Tender</span>` : ''}
            </button>
            <button onclick="game.setDetailSubTab('facilities')" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              this.detailSubTab === 'facilities' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }">
              <span>⛏️ Fasilitas Tambang</span>
            </button>
          </div>

          <!-- Konten Sub-Tab Aktif -->
          <div>
            ${miningTabContent}
          </div>
        </div>
      `;
    }
    else {
      const upgradeCost = this.getBusinessUpgradeCost(biz);
      const isUpgrading = !!biz.upgradeInProgress;
      const durationSec = this.getUpgradeDurationSeconds(biz);
      const canAfford = this.state.cash >= upgradeCost;

      let upgradeActionHtml = '';
      if (isUpgrading) {
        const remSec = Math.max(0, Math.ceil((biz.upgradeEndTime - Date.now()) / 1000));
        const startTime = biz.upgradeStartTime || Date.now();
        const endTime = biz.upgradeEndTime || (Date.now() + 1000);
        const progress = Math.min(100, Math.max(0, ((Date.now() - startTime) / (endTime - startTime)) * 100));

        upgradeActionHtml = `
          <div class="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/40 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-emerald-300 flex items-center gap-1.5">
                <span class="upgrade-pulsing-badge">🏗️</span>
                Pembangunan Level ${biz.upgradeTargetLevel} Sedang Dikerjakan
              </span>
              <span data-biz-timer="${biz.upgradeEndTime}" class="font-mono font-bold text-emerald-400">
                ${this.formatDuration(remSec)}
              </span>
            </div>
            <div class="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div data-biz-progress data-biz-start="${startTime}" data-biz-end="${endTime}" class="h-full bg-emerald-400 progress-striped" style="width: ${progress}%"></div>
            </div>
            <div class="text-[11px] text-slate-400 text-center">Fasilitas sedang diperluas oleh tim kontraktor...</div>
          </div>
        `;
      } else {
        upgradeActionHtml = `
          <button onclick="game.upgradeBusinessLevel('${biz.instanceId}')" class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition ${
            canAfford
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }">
            Tingkatkan ke Level ${biz.level + 1} (${this.formatCompact(upgradeCost)}) • ⏱️ ${this.formatDuration(durationSec)}
          </button>
        `;
      }

      specificSectionHtml = `
        <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div class="flex justify-between items-center pb-2 border-b border-slate-800">
            <span class="text-slate-400">Nama Perusahaan:</span>
            <span class="font-bold text-white">${biz.name}</span>
          </div>
          <div class="flex justify-between items-center pb-2 border-b border-slate-800">
            <span class="text-slate-400">Sektor Industri:</span>
            <span class="font-bold text-emerald-400">${sector.name}</span>
          </div>
          <div class="flex justify-between items-center pb-2 border-b border-slate-800">
            <span class="text-slate-400">Tingkat Operasional:</span>
            <span class="font-bold text-white">Level ${biz.level}</span>
          </div>
          ${upgradeActionHtml}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="mb-3 flex items-center justify-between pb-2 border-b border-slate-800">
        <button onclick="game.showOwnedBusinesses()" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1">
          <span>← Kembali ke Bisnis Saya</span>
        </button>
        ${bizTax.suspended ? `<span class="text-xs font-black text-rose-400">Rp 0/jam (Dibekukan DJP)</span>` : (biz.sectorId === 'airline'
          ? (hourlyRev > 0 ? `<span class="text-xs font-black text-emerald-400">+${this.formatCompact(hourlyRev)}/jam (Tiket)</span>` : `<span class="text-xs font-black text-rose-400">Rp 0/jam (Armada Grounded)</span>`)
          : (hourlyRev >= 0 
            ? `<span class="text-xs font-black text-emerald-400">+${this.formatCompact(hourlyRev)}/jam</span>` 
            : `<span class="text-xs font-black text-rose-400">${this.formatCompact(hourlyRev)}/jam (Beban Gaji)</span>`))}
      </div>

      <div class="glass-panel rounded-2xl border ${bizTax.suspended ? 'tax-suspended-glow border-rose-500/80 bg-rose-950/10' : 'border-slate-800'} overflow-hidden mb-3">
        <div class="relative h-28 w-full bg-slate-800 overflow-hidden">
          <img src="${sector.image}" alt="${biz.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          
          <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between">
            <div>
              <div class="text-[11px] text-emerald-400 font-bold uppercase">${sector.name}</div>
              <h3 class="font-black text-white text-lg leading-tight drop-shadow-md">${biz.name}</h3>
            </div>
            ${bizTax.suspended ? `
              <span class="text-[10px] px-2.5 py-1 rounded-full bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20 tax-warning-pulse">
                ⚠️ DIBEKUKAN DJP
              </span>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Valuasi & Laba Bersih All-Time -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">🏛️ Valuasi Aset Bisnis</span>
          <div class="text-sm font-black text-amber-300 font-mono mt-0.5">${this.formatMoney(bizValuation)}</div>
          <span class="text-[9px] text-slate-500">Estimasi total nilai aset & fasilitas</span>
        </div>
        <div class="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-semibold flex items-center gap-1">📊 Laba Bersih All-Time</span>
          <div class="text-sm font-black ${allTimeEarn >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-mono mt-0.5">
            ${allTimeEarn >= 0 ? '+' : ''}${this.formatMoney(allTimeEarn)}
          </div>
          <span class="text-[9px] text-slate-500">Total akumulasi keuntungan bersih</span>
        </div>
      </div>

      <!-- Opsi Jual Bisnis (30% Valuasi Pasar) -->
      <div class="p-3 rounded-2xl bg-slate-900/90 border border-rose-500/30 flex items-center justify-between gap-2.5 mb-3">
        <div class="min-w-0 flex-1">
          <div class="text-xs font-bold text-white flex items-center gap-1.5">
            <span>🏷️ Jual & Likuidasi Bisnis</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5 leading-snug">
            Cairkan dana <strong class="text-amber-300 font-bold">30%</strong> dari kapitalisasi pasar (<strong class="text-emerald-400 font-mono font-bold">${this.formatMoney(Math.round(bizValuation * 0.3))}</strong>).
          </div>
        </div>
        <button onclick="game.sellBusiness('${biz.instanceId}')" class="btn-press px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-md shadow-rose-600/20">
          <span>Jual Bisnis</span>
        </button>
      </div>

      <!-- Pajak Status Bisnis jika ada tunggakan -->
      ${bizTax.unpaid > 0 ? `
        <div class="p-3 rounded-2xl ${bizTax.suspended ? 'bg-rose-500/10 border border-rose-500 text-rose-300' : 'bg-amber-500/10 border border-amber-500/40 text-amber-300'} mb-3 space-y-2 shadow-md">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="flex items-center gap-1.5">
              ${bizTax.suspended ? '🚨 Operasional Dibekukan DJP' : '⏳ SPT Pajak Mandiri Perusahaan'}
            </span>
            ${!bizTax.suspended && bizTax.deadline ? `<span class="font-mono font-bold text-amber-400 text-xs" data-tax-timer="${bizTax.deadline}">...</span>` : `<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black">SANKSI DJP</span>`}
          </div>
          <p class="text-[11px] text-slate-300">
            Tunggakan Pajak (5%): <strong class="${bizTax.suspended ? 'text-rose-400' : 'text-amber-300'}">${this.formatMoney(bizTax.unpaid)}</strong>
            ${bizTax.suspended ? ' — Operasional perusahaan ini dihentikan oleh DJP sampai tunggakan dilunasi.' : ' — Wajib dibayarkan sebelum batas waktu 72 jam real-time berakhir.'}
          </p>
          <button onclick="game.payBusinessTax('${biz.instanceId}')" class="btn-press w-full py-2 rounded-xl ${bizTax.suspended ? 'bg-rose-500 text-slate-950 hover:bg-rose-400' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'} font-black text-xs shadow-md">
            💳 Lunasi Pajak Bisnis Ini (${this.formatMoney(bizTax.unpaid)})
          </button>
        </div>
      ` : ''}

      ${specificSectionHtml}
    `;
  },

  renderInvestments() {
    this.renderStockList();
    this.renderCryptoList();
    this.renderCommodities();
    this.renderRealEstate();
  },

  renderStockList() {
    const portView = document.getElementById('stocks-view-portfolio');
    const mktView = document.getElementById('stocks-view-market');
    const portCont = document.getElementById('stock-portfolio-container');
    const summaryCard = document.getElementById('stocks-summary-card');
    const mktCont = document.getElementById('stock-list-container');
    const countEl = document.getElementById('stocks-portfolio-count');
    const stockBanner = document.getElementById('stocks-tax-banner');

    // 1. RENDER PORTFOLIO VIEW (Default View)
    if (this.stockView === 'portfolio') {
      if (portView) portView.classList.remove('hidden');
      if (mktView) mktView.classList.add('hidden');

      // Render Tax Banner di Portofolio Saham
      if (stockBanner && this.state.taxes) {
        const taxStock = this.state.taxes.stocks;
        if (taxStock && taxStock.suspended) {
          stockBanner.className = 'mb-3.5 p-3.5 rounded-2xl bg-rose-500/10 border tax-suspended-glow border-rose-500 text-xs shadow-lg space-y-2';
          stockBanner.innerHTML = `
            <div class="flex items-center justify-between text-rose-400 font-black">
              <span class="flex items-center gap-1.5">🚨 DIVIDEN SAHAM DIBEKUKAN OLEH KANTOR PAJAK (DJP)</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black">SANKSI DJP</span>
            </div>
            <p class="text-[11px] text-slate-300">
              Anda memiliki tunggakan pajak dividen saham sebesar <strong class="text-rose-400">${this.formatMoney(taxStock.unpaid)}</strong> yang telah melewati batas 72 jam dunia nyata. Seluruh pencairan dividen saham dibekukan (Rp 0/jam) sampai pajak dilunasi!
            </p>
            <button onclick="game.payTax('stocks')" class="btn-press w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5">
              <span>💳 Lunasi Pajak Dividen Saham Sekarang (${this.formatMoney(taxStock.unpaid)})</span>
            </button>
          `;
          stockBanner.classList.remove('hidden');
        } else if (taxStock && taxStock.unpaid > 0) {
          const remSec = Math.max(0, Math.ceil((taxStock.deadline - Date.now()) / 1000));
          const mins = Math.floor(remSec / 60);
          const secs = remSec % 60;
          stockBanner.className = 'mb-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs shadow-md space-y-2';
          stockBanner.innerHTML = `
            <div class="flex items-center justify-between text-amber-300 font-bold">
              <span class="flex items-center gap-1.5">⏳ Tagihan Pajak Dividen Saham Berjalan</span>
              <span class="font-mono text-amber-400 font-bold" data-tax-timer="${taxStock.deadline}">${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-300">Pajak Terhutang (5%): <strong class="text-amber-300">${this.formatMoney(taxStock.unpaid)}</strong></span>
              <button onclick="game.payTax('stocks')" class="btn-press px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                Bayar Pajak
              </button>
            </div>
          `;
          stockBanner.classList.remove('hidden');
        } else {
          stockBanner.className = 'hidden mb-3';
          stockBanner.innerHTML = '';
        }
      }

      let totalShares = 0;
      let totalMarketVal = 0;
      let totalCostVal = 0;
      let totalHourlyDiv = 0;
      let ownedCount = 0;

      const isStocksSuspended = this.state.taxes && this.state.taxes.stocks && this.state.taxes.stocks.suspended;

      const ownedStocks = [];
      STOCKS_CATALOG.forEach(stock => {
        const userHold = this.state.stocks[stock.symbol] || { shares: 0, totalCost: 0 };
        if (userHold.shares > 0) {
          const price = this.stockPrices[stock.symbol] || stock.basePrice;
          const marketVal = userHold.shares * price;
          const pnl = marketVal - userHold.totalCost;
          const hourlyDiv = Math.round(marketVal * (stock.dividendYieldHourly || 0));

          totalShares += userHold.shares;
          totalMarketVal += marketVal;
          totalCostVal += userHold.totalCost;
          totalHourlyDiv += hourlyDiv;
          ownedCount += 1;

          ownedStocks.push({ stock, userHold, price, marketVal, pnl, hourlyDiv });
        }
      });

      if (countEl) countEl.innerText = `${ownedCount} Saham Dimiliki`;

      const totalPnL = totalMarketVal - totalCostVal;
      const pnlPercent = totalCostVal > 0 ? (totalPnL / totalCostVal) * 100 : 0;

      if (summaryCard) {
        summaryCard.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Nilai Saham:</span>
              <div class="text-base font-black text-white">${this.formatMoney(totalMarketVal)}</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400">Hasil Dividen:</span>
              <div class="text-xs font-black ${isStocksSuspended ? 'text-rose-400' : 'text-emerald-400'}">
                ${isStocksSuspended ? 'Rp 0/jam (Disuspend DJP)' : `+${this.formatCompact(totalHourlyDiv)}/jam`}
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs pt-0.5">
            <span class="text-slate-400">Total Untung / Rugi (P&L):</span>
            <span class="font-extrabold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
              ${totalPnL >= 0 ? '+' : ''}${this.formatMoney(totalPnL)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)
            </span>
          </div>
        `;
      }

      if (portCont) {
        if (ownedStocks.length === 0) {
          portCont.innerHTML = `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
              <div class="text-4xl">📈</div>
              <h4 class="font-bold text-white text-sm">Belum Ada Saham di Portofolio</h4>
              <p class="text-xs text-slate-400">Beli saham dari 16 emiten perusahaan terbuka untuk mendapatkan dividen per jam dan potensi keuntungan modal (capital gain).</p>
              <button onclick="game.setStockView('market')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                + Beli Saham Baru di Bursa
              </button>
            </div>
          `;
        } else {
          portCont.innerHTML = ownedStocks.map(({ stock, userHold, price, marketVal, pnl, hourlyDiv }) => {
            const pnlP = userHold.totalCost > 0 ? (pnl / userHold.totalCost) * 100 : 0;
            const history = this.stockHistories[stock.symbol];
            const prevPrice = history && history.length >= 2 ? history[history.length - 2] : price;
            const changePercent = ((price - prevPrice) / prevPrice) * 100;
            const isUp = changePercent >= 0;
            const sparklineSvg = this.generateSparkline(history, isUp ? '#00e676' : '#ff3366');

            return `
              <div class="glass-panel p-3.5 rounded-2xl border ${isStocksSuspended ? 'tax-suspended-glow border-rose-500/80 bg-rose-950/10' : 'border-slate-800/80'} mb-3 card-transition shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                      ${stock.icon}
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-white text-sm">${stock.symbol}</span>
                        <span class="text-[11px] text-slate-400 font-medium">(${stock.category})</span>
                      </div>
                      <div class="text-xs text-slate-400 font-medium">${stock.name}</div>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="font-bold text-white text-sm">${this.formatMoney(price)}</div>
                    <div class="text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}">
                      ${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div class="my-2 h-6 w-full overflow-hidden flex items-center justify-center">
                  ${sparklineSvg}
                </div>

                <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs mb-2.5">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Lembar Dimiliki:</span>
                    <span class="font-bold text-white">${userHold.shares.toLocaleString()} Lembar (${this.formatMoney(marketVal)})</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Keuntungan / Kerugian:</span>
                    <span class="font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                      ${pnl >= 0 ? '+' : ''}${this.formatMoney(pnl)} (${pnlP >= 0 ? '+' : ''}${pnlP.toFixed(2)}%)
                    </span>
                  </div>
                  <div class="flex justify-between border-t border-slate-800/60 pt-1">
                    <span class="text-slate-400">Dividen Rutin:</span>
                    <span class="font-bold ${isStocksSuspended ? 'text-rose-400' : 'text-emerald-400'}">
                      ${isStocksSuspended ? 'Rp 0/jam (Dibekukan DJP)' : `+${this.formatMoney(hourlyDiv)}/jam (+${(stock.dividendYieldHourly * 100).toFixed(2)}%)`}
                    </span>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button onclick="game.sellStock('${stock.symbol}', Math.max(1, Math.floor(${userHold.shares} * 0.25)))" class="btn-press flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold">
                    Jual 25%
                  </button>
                  <button onclick="event.stopPropagation(); game.openStockDetail('${stock.symbol}')" class="btn-press flex-1 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-1 shadow-sm">
                    <span>Detail & Trading 📊</span>
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }

    // 2. RENDER MARKET VIEW
    else {
      if (portView) portView.classList.add('hidden');
      if (mktView) mktView.classList.remove('hidden');

      if (mktCont) {
        let html = '';
        STOCKS_CATALOG.forEach(stock => {
          const price = this.stockPrices[stock.symbol];
          const history = this.stockHistories[stock.symbol];
          const prevPrice = history && history.length >= 2 ? history[history.length - 2] : price;
          const changePercent = ((price - prevPrice) / prevPrice) * 100;
          const isUp = changePercent >= 0;

          const userHold = this.state.stocks[stock.symbol] || { shares: 0, totalCost: 0 };
          const holdValue = userHold.shares * price;
          const profitLoss = holdValue - userHold.totalCost;
          const sparklineSvg = this.generateSparkline(history, isUp ? '#00e676' : '#ff3366');

          html += `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800/80 mb-3 card-transition cursor-pointer hover:border-blue-500/50" onclick="game.openStockDetail('${stock.symbol}')">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                    ${stock.icon}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-white text-sm">${stock.symbol}</span>
                      <span class="text-[11px] text-slate-400 font-medium">(${stock.category})</span>
                    </div>
                    <div class="text-xs text-slate-400 font-medium">${stock.name}</div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="font-bold text-white text-sm">${this.formatMoney(price)}</div>
                  <div class="text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'} flex items-center justify-end gap-0.5">
                    <span>${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              <div class="my-2 h-7 w-full overflow-hidden flex items-center justify-center">
                ${sparklineSvg}
              </div>

              <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span class="text-slate-400">Dimiliki: </span>
                  <span class="font-bold text-white">${userHold.shares.toLocaleString()} lembar</span>
                  ${userHold.shares > 0 ? `
                    <span class="text-[11px] ml-1.5 ${profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                      (${profitLoss >= 0 ? '+' : ''}${this.formatCompact(profitLoss)})
                    </span>
                  ` : ''}
                  <div class="text-[11px] text-emerald-400/80 mt-0.5">Dividen: +${(stock.dividendYieldHourly * 100).toFixed(2)}%/jam</div>
                </div>

                <button onclick="event.stopPropagation(); game.openStockDetail('${stock.symbol}')" class="btn-press px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm">
                  Detail & Trade 📊
                </button>
              </div>
            </div>
          `;
        });
        mktCont.innerHTML = html;
      }
    }
  },

  renderCryptoList() {
    const portView = document.getElementById('crypto-view-portfolio');
    const mktView = document.getElementById('crypto-view-market');
    const portCont = document.getElementById('crypto-portfolio-container');
    const summaryCard = document.getElementById('crypto-summary-card');
    const mktCont = document.getElementById('crypto-list-container');
    const countEl = document.getElementById('crypto-portfolio-count');

    // 1. RENDER PORTFOLIO VIEW (Default View)
    if (this.cryptoView === 'portfolio') {
      if (portView) portView.classList.remove('hidden');
      if (mktView) mktView.classList.add('hidden');

      let totalMarketVal = 0;
      let totalCostVal = 0;
      let ownedCount = 0;

      const ownedCrypto = [];
      CRYPTO_CATALOG.forEach(coin => {
        const userHold = this.state.crypto[coin.symbol] || { amount: 0, totalCost: 0 };
        if (userHold.amount > 0.00001) {
          const price = this.cryptoPrices[coin.symbol] || coin.basePrice;
          const marketVal = userHold.amount * price;
          const pnl = marketVal - userHold.totalCost;

          totalMarketVal += marketVal;
          totalCostVal += userHold.totalCost;
          ownedCount += 1;

          ownedCrypto.push({ coin, userHold, price, marketVal, pnl });
        } else if (userHold.amount > 0) {
          userHold.amount = 0;
          userHold.totalCost = 0;
        }
      });

      if (countEl) countEl.innerText = `${ownedCount} Aset Kripto Dimiliki`;

      const totalPnL = totalMarketVal - totalCostVal;
      const pnlPercent = totalCostVal > 0 ? (totalPnL / totalCostVal) * 100 : 0;

      if (summaryCard) {
        summaryCard.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Nilai Dompet Kripto:</span>
              <div class="text-base font-black text-amber-400">${this.formatMoney(totalMarketVal)}</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Modal:</span>
              <div class="text-xs font-bold text-white">${this.formatCompact(totalCostVal)}</div>
            </div>
          </div>
          <div class="flex items-center justify-between text-xs pt-0.5">
            <span class="text-slate-400">Total Untung / Rugi (P&L):</span>
            <span class="font-extrabold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
              ${totalPnL >= 0 ? '+' : ''}${this.formatMoney(totalPnL)} (${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%)
            </span>
          </div>
        `;
      }

      if (portCont) {
        if (ownedCrypto.length === 0) {
          portCont.innerHTML = `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
              <div class="text-4xl">🪙</div>
              <h4 class="font-bold text-white text-sm">Dompet Kripto Masih Kosong</h4>
              <p class="text-xs text-slate-400">Investasi pada mata uang kripto global untuk meraih keuntungan dari pergerakan harga yang dinamis.</p>
              <button onclick="game.setCryptoView('market')" class="btn-press px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20">
                + Beli Kripto Baru di Pasar
              </button>
            </div>
          `;
        } else {
          portCont.innerHTML = ownedCrypto.map(({ coin, userHold, price, marketVal, pnl }) => {
            const pnlP = userHold.totalCost > 0 ? (pnl / userHold.totalCost) * 100 : 0;
            const history = this.cryptoHistories[coin.symbol];
            const prevPrice = history && history.length >= 2 ? history[history.length - 2] : price;
            const changePercent = ((price - prevPrice) / prevPrice) * 100;
            const isUp = changePercent >= 0;
            const sparklineSvg = this.generateSparkline(history, isUp ? '#00e676' : '#ff3366');

            return `
              <div class="glass-panel p-3.5 rounded-2xl border border-slate-800/80 mb-3 card-transition shadow-sm">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-md bg-slate-900 border border-amber-500/30">
                      <img src="${coin.logo || 'images/crypto_bitcoin.svg'}" alt="${coin.name}" class="w-full h-full object-contain">
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-bold text-white text-sm">${coin.name}</span>
                        <span class="text-xs text-slate-400 font-semibold">(${coin.symbol})</span>
                      </div>
                      <div class="text-xs text-slate-400 font-medium">Volatilitas Tinggi</div>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="font-bold text-white text-sm">${this.formatMoney(price)}</div>
                    <div class="text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}">
                      ${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div class="my-2 h-6 w-full overflow-hidden flex items-center justify-center">
                  ${sparklineSvg}
                </div>

                <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs mb-2.5">
                  <div class="flex justify-between">
                    <span class="text-slate-400">Saldo Koin:</span>
                    <span class="font-bold text-white">${userHold.amount.toFixed(4)} ${coin.symbol}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-400">Nilai Pasar Saat Ini:</span>
                    <span class="font-bold text-amber-400">${this.formatMoney(marketVal)}</span>
                  </div>
                  <div class="flex justify-between border-t border-slate-800/60 pt-1">
                    <span class="text-slate-400">Untung / Rugi (P&L):</span>
                    <span class="font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                      ${pnl >= 0 ? '+' : ''}${this.formatMoney(pnl)} (${pnlP >= 0 ? '+' : ''}${pnlP.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button onclick="game.sellCrypto('${coin.symbol}', 0.5)" class="btn-press flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold">
                    Jual 50%
                  </button>
                  <button onclick="game.sellCrypto('${coin.symbol}', 1.0)" class="btn-press flex-1 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold">
                    Jual 100%
                  </button>
                  <button onclick="event.stopPropagation(); game.openCryptoDetail('${coin.symbol}')" class="btn-press flex-1 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center justify-center gap-1 shadow-sm">
                    <span>Detail & Trading ⚡</span>
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }

    // 2. RENDER MARKET VIEW
    else {
      if (portView) portView.classList.add('hidden');
      if (mktView) mktView.classList.remove('hidden');

      if (mktCont) {
        let html = '';
        CRYPTO_CATALOG.forEach(coin => {
          const price = this.cryptoPrices[coin.symbol];
          const history = this.cryptoHistories[coin.symbol];
          const prevPrice = history && history.length >= 2 ? history[history.length - 2] : price;
          const changePercent = ((price - prevPrice) / prevPrice) * 100;
          const isUp = changePercent >= 0;

          const userHold = this.state.crypto[coin.symbol] || { amount: 0, totalCost: 0 };
          const holdValue = userHold.amount * price;
          const profitLoss = holdValue - userHold.totalCost;
          const sparklineSvg = this.generateSparkline(history, isUp ? '#00e676' : '#ff3366');

          html += `
            <div class="glass-panel p-3.5 rounded-2xl border border-slate-800/80 mb-3 card-transition cursor-pointer hover:border-amber-500/50" onclick="game.openCryptoDetail('${coin.symbol}')">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold" style="color: ${coin.color}">
                    ${coin.icon}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-bold text-white text-sm">${coin.name}</span>
                      <span class="text-xs text-slate-400 font-semibold">(${coin.symbol})</span>
                    </div>
                    <div class="text-xs text-slate-400 font-medium">Volatilitas Tinggi</div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="font-bold text-white text-sm">${this.formatMoney(price)}</div>
                  <div class="text-xs font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}">
                    ${isUp ? '▲' : '▼'} ${Math.abs(changePercent).toFixed(2)}%
                  </div>
                </div>
              </div>

              <div class="my-2 h-7 w-full overflow-hidden flex items-center justify-center">
                ${sparklineSvg}
              </div>

              <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span class="text-slate-400">Saldo: </span>
                  <span class="font-bold text-white">${(userHold.amount > 0.00001 ? userHold.amount : 0).toFixed(4)} ${coin.symbol}</span>
                  ${userHold.amount > 0.00001 ? `
                    <div class="text-[11px] ${profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                      ${profitLoss >= 0 ? '+' : ''}${this.formatCompact(profitLoss)}
                    </div>
                  ` : ''}
                </div>

                <button onclick="event.stopPropagation(); game.openCryptoDetail('${coin.symbol}')" class="btn-press px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm">
                  Detail & Trade ⚡
                </button>
              </div>
            </div>
          `;
        });
        mktCont.innerHTML = html;
      }
    }
  },

  renderCommodities() {
    const sec = document.getElementById('invest-commodity-sec');
    if (!sec) return;

    const commList = typeof COMMODITIES_CATALOG !== 'undefined' ? COMMODITIES_CATALOG : [];
    const positions = Array.isArray(this.state.commodityPositions) ? this.state.commodityPositions : [];

    // Calculate Position Stats
    let totalMargin = 0;
    let totalPnl = 0;
    positions.forEach(pos => {
      totalMargin += pos.margin;
      const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
      const priceChange = (curPrice - pos.entryPrice) / pos.entryPrice;
      const pnlRate = (pos.type === 'LONG' ? priceChange : -priceChange) * (pos.leverage || 1);
      totalPnl += Math.round(pos.margin * pnlRate);
    });

    const realizedProfit = (this.state.stats && this.state.stats.commodityTradingProfit) || 0;
    const pnlSign = totalPnl >= 0 ? '+' : '';
    const pnlColor = totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400';

    let html = `
      <!-- SUMMARY CARD TRADING KOMODITAS -->
      <div class="glass-panel p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div class="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div>
            <h3 class="font-black text-white text-sm flex items-center gap-1.5">
              <span>🛢️</span> Bursa Trading Komoditas Berjangka
            </h3>
            <p class="text-[11px] text-slate-400">Trading posisi LONG (Prediksi Naik) atau SHORT (Prediksi Turun) dengan leverage hingga 20x</p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
            ${positions.length} Kontrak Aktif
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Jaminan Terpasang</span>
            <span class="font-black text-white text-sm">${this.formatMoney(totalMargin)}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Floating PnL</span>
            <span class="font-black ${pnlColor} text-sm">${pnlSign}${this.formatMoney(totalPnl)}</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <span class="text-[10px] text-slate-400 block uppercase font-bold">Total Laba Terealisasi</span>
            <span class="font-black ${realizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} text-sm">
              ${realizedProfit >= 0 ? '+' : ''}${this.formatMoney(realizedProfit)}
            </span>
          </div>
        </div>
      </div>

      <!-- DAFTAR POSISI TERBUKA (OPEN POSITIONS) -->
      <div>
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>📋</span> Posisi Kontrak Terbuka (${positions.length})
          </h4>
        </div>
    `;

    if (positions.length === 0) {
      html += `
        <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-2">
          <div class="text-3xl">📭</div>
          <div class="font-bold text-slate-300 text-xs">Belum Ada Posisi Kontrak Terbuka</div>
          <div class="text-[11px] text-slate-500 max-w-xs mx-auto">
            Buka posisi LONG atau SHORT pada komoditas di bawah untuk mulai berspekulasi dan meraih keuntungan!
          </div>
        </div>
      `;
    } else {
      html += `<div class="space-y-2.5">`;
      positions.forEach(pos => {
        const comm = commList.find(c => c.symbol === pos.symbol) || { name: pos.symbol, icon: '📦', unit: 'unit' };
        const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
        const priceDiff = curPrice - pos.entryPrice;
        const priceDiffPct = (priceDiff / pos.entryPrice);
        const pnlRate = (pos.type === 'LONG' ? priceDiffPct : -priceDiffPct) * (pos.leverage || 1);
        const posPnl = Math.round(pos.margin * pnlRate);
        const posPnlSign = posPnl >= 0 ? '+' : '';
        const posPnlColor = posPnl >= 0 ? 'text-emerald-400' : 'text-rose-400';
        const isLong = pos.type === 'LONG';
        const posTotalVal = pos.margin * (pos.leverage || 1);

        html += `
          <div class="glass-panel p-3.5 rounded-2xl border ${isLong ? 'border-emerald-500/30' : 'border-rose-500/30'} bg-slate-950/60 shadow-md">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="text-lg">${comm.icon}</span>
                <div>
                  <div class="font-extrabold text-white text-xs flex items-center gap-1.5">
                    <span>${comm.name}</span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${isLong ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}">
                      ${isLong ? '🟢 LONG' : '🔴 SHORT'}
                    </span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ${pos.leverage || 1}x
                    </span>
                  </div>
                  <div class="text-[10px] text-slate-400">Modal Jaminan: ${this.formatMoney(pos.margin)} (Nilai: ${this.formatCompact(posTotalVal)})</div>
                </div>
              </div>
              <button onclick="game.closeCommodityPosition('${pos.id}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold shadow-sm">
                Tutup Posisi
              </button>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-2 text-[11px]">
              <div>
                <span class="text-slate-500 block text-[10px]">Harga Masuk:</span>
                <span class="font-mono font-bold text-slate-300">${this.formatMoney(pos.entryPrice)}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px]">Harga Saat Ini:</span>
                <span class="font-mono font-bold text-white">${this.formatMoney(curPrice)}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-500 block text-[10px]">Floating PnL:</span>
                <span class="font-mono font-black ${posPnlColor}">
                  ${posPnlSign}${this.formatMoney(posPnl)} (${posPnlSign}${(pnlRate * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `
      </div>

      <!-- KATALOG PASAR KOMODITAS -->
      <div class="pt-2">
        <div class="flex justify-between items-center mb-2">
          <h4 class="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <span>🌐</span> Pasar Komoditas Berjangka Global
          </h4>
          <span class="text-[10px] text-slate-400">Harga update live</span>
        </div>

        <div class="space-y-2.5">
    `;

    commList.forEach(comm => {
      const curPrice = (this.commodityPrices && this.commodityPrices[comm.symbol]) || comm.basePrice;
      const history = (this.commodityHistories && this.commodityHistories[comm.symbol]) || [comm.basePrice];
      const prevPrice = history.length > 1 ? history[0] : comm.basePrice;
      const changePct = ((curPrice - prevPrice) / prevPrice) * 100;
      const isUp = changePct >= 0;
      const changeColor = isUp ? 'text-emerald-400' : 'text-rose-400';
      const sparklineSvg = this.generateSparkline(history, isUp ? '#34d399' : '#f87171');

      html += `
        <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 shadow-md card-transition">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">${comm.icon}</span>
              <div>
                <div class="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>${comm.name}</span>
                  <span class="font-mono text-[10px] text-slate-400">(${comm.symbol})</span>
                </div>
                <div class="text-[10px] text-slate-400">${comm.desc}</div>
              </div>
            </div>
            <div class="w-16 h-8 flex-shrink-0">
              ${sparklineSvg}
            </div>
          </div>

          <div class="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-800/80">
            <div>
              <div class="font-black text-white text-sm">${this.formatMoney(curPrice)} <span class="text-[10px] font-normal text-slate-400">/ ${comm.unit}</span></div>
              <div class="text-[10px] font-bold ${changeColor}">
                ${isUp ? '▲ +' : '▼ '}${changePct.toFixed(2)}%
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button onclick="game.openCommodityModal('${comm.symbol}', 'LONG')" class="btn-press px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1 shadow-sm">
                <span>🟢</span> LONG
              </button>
              <button onclick="game.openCommodityModal('${comm.symbol}', 'SHORT')" class="btn-press px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-black flex items-center gap-1 shadow-sm">
                <span>🔴</span> SHORT
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    sec.innerHTML = html;
  },

  renderRealEstate() {
    const portView = document.getElementById('property-view-portfolio');
    const catView = document.getElementById('property-view-catalog');
    const portCont = document.getElementById('property-portfolio-container');
    const summaryCard = document.getElementById('property-summary-card');
    const catCont = document.getElementById('realestate-list-container');
    const countEl = document.getElementById('property-portfolio-count');
    const propBanner = document.getElementById('property-tax-banner');

    // 1. RENDER PORTFOLIO VIEW (Default View)
    if (this.propertyView === 'portfolio') {
      if (portView) portView.classList.remove('hidden');
      if (catView) catView.classList.add('hidden');

      // Render Tax Banner di Portofolio Properti
      if (propBanner && this.state.taxes) {
        const taxProp = this.state.taxes.property;
        if (taxProp && taxProp.suspended) {
          propBanner.className = 'mb-3.5 p-3.5 rounded-2xl bg-rose-500/10 border tax-suspended-glow border-rose-500 text-xs shadow-lg space-y-2';
          propBanner.innerHTML = `
            <div class="flex items-center justify-between text-rose-400 font-black">
              <span class="flex items-center gap-1.5">🚨 SEWA PROPERTI DIBEKUKAN OLEH KANTOR PAJAK (DJP)</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-slate-950 font-black">SANKSI DJP</span>
            </div>
            <p class="text-[11px] text-slate-300">
              Anda memiliki tunggakan pajak sewa properti sebesar <strong class="text-rose-400">${this.formatMoney(taxProp.unpaid)}</strong> yang telah melewati batas 72 jam dunia nyata. Seluruh pendapatan sewa dibekukan (Rp 0/jam) sampai pajak dilunasi!
            </p>
            <button onclick="game.payTax('property')" class="btn-press w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs shadow-md shadow-rose-500/20 flex items-center justify-center gap-1.5">
              <span>💳 Lunasi Pajak Sewa Properti Sekarang (${this.formatMoney(taxProp.unpaid)})</span>
            </button>
          `;
          propBanner.classList.remove('hidden');
        } else if (taxProp && taxProp.unpaid > 0) {
          const remSec = Math.max(0, Math.ceil((taxProp.deadline - Date.now()) / 1000));
          const mins = Math.floor(remSec / 60);
          const secs = remSec % 60;
          propBanner.className = 'mb-3.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs shadow-md space-y-2';
          propBanner.innerHTML = `
            <div class="flex items-center justify-between text-amber-300 font-bold">
              <span class="flex items-center gap-1.5">⏳ Tagihan Pajak Sewa Properti Berjalan</span>
              <span class="font-mono text-amber-400 font-bold" data-tax-timer="${taxProp.deadline}">${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}</span>
            </div>
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-slate-300">Pajak Terhutang (5%): <strong class="text-amber-300">${this.formatMoney(taxProp.unpaid)}</strong></span>
              <button onclick="game.payTax('property')" class="btn-press px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                Bayar Pajak
              </button>
            </div>
          `;
          propBanner.classList.remove('hidden');
        } else {
          propBanner.className = 'hidden mb-3';
          propBanner.innerHTML = '';
        }
      }

      let totalUnits = 0;
      let totalGrossRent = 0;
      let totalMaintenance = 0;
      let totalValuation = 0;

      const isPropSuspended = this.state.taxes && this.state.taxes.property && this.state.taxes.property.suspended;

      const ownedProps = [];
      REAL_ESTATE_CATALOG.forEach(prop => {
        const pData = this.getPropertyData(prop.id);
        if (pData.count > 0) {
          let multiplier = 1.0;
          if (pData.furnished) multiplier += 0.25;
          if (pData.internet) multiplier += 0.15;
          const condMultiplier = Math.max(0.4, (pData.condition !== undefined ? pData.condition : 100) / 100);

          const gross = Math.round(prop.hourlyRent * multiplier * condMultiplier * pData.count);
          const maint = Math.round((prop.hourlyMaintenance || (prop.hourlyRent * 0.12)) * pData.count);
          const net = gross - maint;

          let unitVal = prop.price;
          if (pData.furnished) unitVal += prop.furnitureCost;
          if (pData.internet) unitVal += prop.internetCost;
          const val = unitVal * pData.count;

          totalUnits += pData.count;
          totalGrossRent += gross;
          totalMaintenance += maint;
          totalValuation += val;

          ownedProps.push({ prop, pData, gross, maint, net, val });
        }
      });

      if (countEl) countEl.innerText = `${totalUnits} Unit Dimiliki`;

      const totalNetRent = totalGrossRent - totalMaintenance;

      if (summaryCard) {
        summaryCard.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400">Total Valuasi Properti:</span>
              <div class="text-base font-black text-blue-400">${this.formatMoney(totalValuation)}</div>
            </div>
            <div class="text-right">
              <span class="text-[10px] uppercase font-bold text-slate-400">Arus Bersih (Net Rent):</span>
              <div class="text-xs font-black ${isPropSuspended ? 'text-rose-400' : (totalNetRent >= 0 ? 'text-emerald-400' : 'text-rose-400')}">
                ${isPropSuspended ? 'Rp 0/jam (Disuspend DJP)' : `${totalNetRent >= 0 ? '+' : ''}${this.formatMoney(totalNetRent)}/jam`}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs pt-0.5">
            <div>
              <span class="text-slate-400 block text-[11px]">Sewa Kotor Diterima:</span>
              <span class="font-bold ${isPropSuspended ? 'text-slate-500' : 'text-emerald-400'}">${isPropSuspended ? 'Rp 0' : '+' + this.formatCompact(totalGrossRent)}/jam</span>
            </div>
            <div class="text-right">
              <span class="text-slate-400 block text-[11px]">Biaya Perawatan Rutin:</span>
              <span class="font-bold text-rose-400">-${this.formatCompact(totalMaintenance)}/jam</span>
            </div>
          </div>
        `;
      }

      if (portCont) {
        if (ownedProps.length === 0) {
          portCont.innerHTML = `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
              <div class="text-4xl">🏠</div>
              <h4 class="font-bold text-white text-sm">Belum Ada Properti di Portofolio</h4>
              <p class="text-xs text-slate-400">Miliki real estate dan apartemen mewah untuk disewakan, pasang tempat tidur dan internet untuk meningkatkan pendapatan sewa berkali lipat!</p>
              <button onclick="game.setPropertyView('catalog')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                + Beli Properti Baru di Katalog
              </button>
            </div>
          `;
        } else {
          portCont.innerHTML = ownedProps.map(({ prop, pData, gross, maint, net, val }) => {
            const cond = pData.condition !== undefined ? pData.condition : 100;
            const condPercent = Math.round(cond);
            const furnCost = prop.furnitureCost * pData.count;
            const netCost = prop.internetCost * pData.count;
            const serviceCost = Math.round(prop.price * 0.03 * pData.count * ((100 - cond) / 100)) + 500000;

            return `
              <div class="glass-panel rounded-2xl border ${isPropSuspended ? 'tax-suspended-glow border-rose-500/80 bg-rose-950/10' : 'border-blue-500/30'} overflow-hidden mb-3.5 card-transition shadow-lg">
                <div class="relative h-32 w-full bg-slate-800 overflow-hidden">
                  <img src="${prop.image}" alt="${prop.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.style.display='none'">
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                  
                  <div class="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-slate-300">
                    <span>${prop.icon}</span>
                    <span>📍 ${prop.location}</span>
                  </div>

                  <div class="absolute top-2 right-2">
                    ${isPropSuspended ? `
                      <span class="text-xs px-2.5 py-1 rounded-full bg-rose-500 text-slate-950 font-black shadow-md shadow-rose-500/20 text-[11px] tax-warning-pulse">
                        ⚠️ Dibekukan DJP
                      </span>
                    ` : `
                      <span class="text-xs px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 text-[11px]">
                        ✓ Milik Anda (1 Unit)
                      </span>
                    `}
                  </div>

                  <div class="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h4 class="font-extrabold text-white text-base leading-tight drop-shadow-md">${prop.name}</h4>
                      <div class="text-[11px] text-slate-300 font-medium">Valuasi: ${this.formatCompact(val)}</div>
                    </div>
                    <span class="text-xs font-black ${isPropSuspended ? 'text-rose-400 border-rose-500/50' : (net >= 0 ? 'text-emerald-400 border-slate-800' : 'text-rose-400 border-slate-800')} bg-slate-950/90 px-2 py-0.5 rounded-lg border">
                      ${isPropSuspended ? 'Rp 0/jam (Disuspend)' : `${net >= 0 ? '+' : ''}${this.formatCompact(net)}/jam`}
                    </span>
                  </div>
                </div>

                <div class="p-3.5 space-y-3">
                  <!-- Breakdown Sewa & Biaya Perawatan -->
                  <div class="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span class="text-slate-400 text-[11px] block">Sewa Kotor:</span>
                      <span class="font-bold text-emerald-400">+${this.formatCompact(gross)}/jam</span>
                    </div>
                    <div class="text-right">
                      <span class="text-slate-400 text-[11px] block">Biaya Perawatan:</span>
                      <span class="font-bold text-rose-400">-${this.formatCompact(maint)}/jam</span>
                    </div>
                  </div>

                  <!-- Kondisi Properti & Servis -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs">
                      <span class="text-slate-400">Kondisi Fisik Properti:</span>
                      <span class="font-bold ${condPercent > 70 ? 'text-emerald-400' : (condPercent > 40 ? 'text-amber-400' : 'text-rose-400')}">
                        ${condPercent}% ${condPercent === 100 ? 'Prima' : (condPercent > 70 ? 'Baik' : 'Butuh Renovasi')}
                      </span>
                    </div>
                    <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div class="h-full ${condPercent > 70 ? 'bg-emerald-400' : (condPercent > 40 ? 'bg-amber-400' : 'bg-rose-500')} transition-all" style="width: ${condPercent}%"></div>
                    </div>
                  </div>

                  <!-- Upgrade Fasilitas: Furnitur & Internet -->
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    ${pData.furnished ? `
                      <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                        <span class="text-xs text-emerald-400 font-bold block">✓ Tempat Tidur</span>
                        <span class="text-[10px] text-slate-400">+25% Sewa</span>
                      </div>
                    ` : `
                      <button onclick="game.buyPropertyFurniture('${prop.id}')" class="btn-press p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center">
                        <span class="text-xs font-bold block">+ Tempat Tidur</span>
                        <span class="text-[10px] text-emerald-400 font-semibold">${this.formatCompact(furnCost)}</span>
                      </button>
                    `}

                    ${pData.internet ? `
                      <div class="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                        <span class="text-xs text-emerald-400 font-bold block">✓ Internet Cepat</span>
                        <span class="text-[10px] text-slate-400">+15% Sewa</span>
                      </div>
                    ` : `
                      <button onclick="game.buyPropertyInternet('${prop.id}')" class="btn-press p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-center">
                        <span class="text-xs font-bold block">+ Pasang Internet</span>
                        <span class="text-[10px] text-emerald-400 font-semibold">${this.formatCompact(netCost)}</span>
                      </button>
                    `}
                  </div>

                  <!-- Action Buttons: Servis & Jual -->
                  <div class="flex items-center gap-2 pt-1 border-t border-slate-800">
                    <button onclick="game.serviceProperty('${prop.id}')" class="btn-press flex-1 py-1.5 rounded-xl ${condPercent < 100 ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40' : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'} text-xs font-bold">
                      🔧 Servis Perbaikan (${this.formatCompact(serviceCost)})
                    </button>
                    <button onclick="game.sellProperty('${prop.id}')" class="btn-press px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/30 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold">
                      Jual Properti (${this.formatCompact(Math.round(prop.price * 0.9))})
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    }

    // 2. RENDER CATALOG VIEW
    else {
      if (portView) portView.classList.add('hidden');
      if (catView) catView.classList.remove('hidden');

      if (catCont) {
        // Ambil hanya properti yang belum dimiliki (count === 0), properti yang sudah dibeli langsung dihilangkan dari katalog
        const unownedProps = REAL_ESTATE_CATALOG.filter(prop => {
          const pData = this.getPropertyData(prop.id);
          return (pData.count || 0) === 0;
        });

        const totalUnownedAll = unownedProps.length;
        const totalUnownedDom = unownedProps.filter(p => p.group === 'domestik').length;
        const totalUnownedGlob = unownedProps.filter(p => p.group === 'global').length;

        const filtered = unownedProps.filter(prop => {
          if (this.realEstateFilter === 'domestik') return prop.group === 'domestik';
          if (this.realEstateFilter === 'global') return prop.group === 'global';
          return true;
        });

        let html = `
          <div class="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
            <button onclick="game.setRealEstateFilter('all')" class="px-3 py-1 rounded-xl text-xs font-bold transition ${this.realEstateFilter === 'all' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
              Semua (${totalUnownedAll})
            </button>
            <button onclick="game.setRealEstateFilter('domestik')" class="px-3 py-1 rounded-xl text-xs font-bold transition ${this.realEstateFilter === 'domestik' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
              🇮🇩 Domestik (${totalUnownedDom})
            </button>
            <button onclick="game.setRealEstateFilter('global')" class="px-3 py-1 rounded-xl text-xs font-bold transition ${this.realEstateFilter === 'global' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'}">
              🌍 Internasional (${totalUnownedGlob})
            </button>
          </div>
        `;

        if (filtered.length === 0) {
          html += `
            <div class="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-3">
              <div class="text-4xl">🏆</div>
              <h4 class="font-bold text-white text-sm">Semua Properti Telah Terjual!</h4>
              <p class="text-xs text-slate-400">Seluruh unit properti pada kategori ini telah Anda miliki. Cek dan kelola properti Anda di portofolio!</p>
              <button onclick="game.setPropertyView('portfolio')" class="btn-press px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20">
                ← Kembali ke Portofolio Properti
              </button>
            </div>
          `;
        } else {
          filtered.forEach(prop => {
            const canAfford = this.state.cash >= prop.price;

            html += `
              <div class="glass-panel rounded-2xl border border-slate-800 overflow-hidden mb-3.5 card-transition shadow-lg">
                <div class="relative h-32 w-full bg-slate-800 overflow-hidden">
                  <img src="${prop.image}" alt="${prop.name}" class="w-full h-full object-cover hover:scale-105 transition duration-500" onerror="this.style.display='none'">
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
                  
                  <div class="absolute top-2 left-2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-slate-300">
                    <span>${prop.icon}</span>
                    <span>📍 ${prop.location}</span>
                  </div>

                  <div class="absolute top-2 right-2">
                    <span class="text-xs px-2.5 py-1 rounded-full bg-slate-900/80 text-emerald-400 border border-emerald-500/30 font-bold text-[11px]">
                      Tersedia 1 Unit Eksklusif
                    </span>
                  </div>

                  <div class="absolute bottom-2 left-3 right-3">
                    <h4 class="font-extrabold text-white text-base leading-tight drop-shadow-md">${prop.name}</h4>
                  </div>
                </div>

                <div class="p-3 pt-2">
                  <div class="grid grid-cols-2 gap-2 text-xs mb-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div>
                      <span class="text-slate-400 text-[10px] block">Sewa Kotor Dasar:</span>
                      <span class="font-bold text-emerald-400">+${this.formatCompact(prop.hourlyRent)}/jam</span>
                    </div>
                    <div class="text-right">
                      <span class="text-slate-400 text-[10px] block">Biaya Perawatan:</span>
                      <span class="font-bold text-rose-400">-${this.formatCompact(prop.hourlyMaintenance || (prop.hourlyRent * 0.12))}/jam</span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs mb-2.5">
                    <span class="text-slate-400 text-[11px]">Harga Properti:</span>
                    <span class="font-black text-white text-sm">${this.formatMoney(prop.price)}</span>
                  </div>

                  <button onclick="game.buyProperty('${prop.id}')" class="btn-press w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                    canAfford
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-emerald-500/20'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }">
                    <span>Beli Properti Ini</span>
                    <span class="opacity-80">(${this.formatCompact(prop.price)})</span>
                  </button>
                </div>
              </div>
            `;
          });
        }

        catCont.innerHTML = html;
      }
    }
  },

  renderLuxury() {
    const dashboardView = document.getElementById('luxury-view-dashboard');
    const subView = document.getElementById('luxury-view-sub');
    if (!dashboardView || !subView) return;

    if (this.luxurySubView) {
      dashboardView.classList.add('hidden');
      subView.classList.remove('hidden');
      this.renderLuxurySubView();
    } else {
      dashboardView.classList.remove('hidden');
      subView.classList.add('hidden');
      this.renderLuxuryDashboard();
    }
  },

  setLuxuryView(view) {
    if (view === 'catalog') {
      this.openLuxuryShop('car');
    } else {
      this.closeLuxurySubView();
    }
  },

  setLuxuryFilter(filter) {
    this.luxuryFilter = filter;
    this.renderLuxury();
  },

  openLuxuryFacility(facility) {
    this.luxurySubView = { type: 'facility', facility };
    this.renderLuxury();
  },

  openLuxuryShop(shopType) {
    this.luxurySubView = { type: 'shop', shopType };
    this.renderLuxury();
  },

  openLuxuryResidence() {
    this.luxurySubView = { type: 'residence' };
    this.renderLuxury();
  },

  openLuxuryCollection(collKey) {
    this.luxurySubView = { type: 'collection', collKey };
    this.renderLuxury();
  },

  closeLuxurySubView() {
    this.luxurySubView = null;
    this.renderLuxury();
  },

  renderLuxuryDashboard() {
    const container = document.getElementById('luxury-view-dashboard');
    if (!container) return;

    const owned = (this.state.luxury || []).map(id => LUXURY_CATALOG.find(x => x.id === id)).filter(Boolean);
    const garageCount = owned.filter(x => x.type === 'car' || x.type === 'moto').length;
    const hangarCount = owned.filter(x => x.type === 'flight').length;
    const harborCount = owned.filter(x => x.type === 'yacht').length;
    const islandCount = owned.filter(x => x.type === 'island').length;

    const resLevel = this.state.residenceLevel || 1;
    const resTier = (typeof RESIDENCE_TIERS !== 'undefined' && RESIDENCE_TIERS[resLevel - 1]) || { name: 'Studio Penthouse', price: 2500000000, prestige: 100 };

    const colls = this.state.collections || {};
    const coinsCount = (colls.coins || []).length;
    const paintingsCount = (colls.paintings || []).length;
    const uniqueCount = (colls.unique || []).length;
    const retroCount = (colls.retro_cars || []).length;
    const jewelsCount = (colls.jewels || []).length;
    const stampsCount = (colls.stamps || []).length;

    // Calculate total prestige from all luxury & collections & residence
    let totalPrestige = resTier.prestige || 0;
    owned.forEach(x => totalPrestige += (x.prestige || 0));
    if (typeof COLLECTIONS_CATALOG !== 'undefined') {
      Object.entries(colls).forEach(([k, arr]) => {
        if (Array.isArray(arr) && COLLECTIONS_CATALOG[k]) {
          arr.forEach(itemId => {
            const it = COLLECTIONS_CATALOG[k].find(x => x.id === itemId);
            if (it) totalPrestige += (it.prestige || 0);
          });
        }
      });
    }

    container.innerHTML = `
      <!-- 1. Header -->
      <div class="flex items-center justify-between pt-1">
        <h1 class="text-2xl font-black text-white tracking-tight">Items</h1>
        <div class="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-amber-400">
          ⭐ ${totalPrestige.toLocaleString()} Prestise
        </div>
      </div>

      <!-- 2. Facilities Row (Garage, Hangar, Harbor, Island) -->
      <div class="grid grid-cols-4 gap-2">
        <!-- Garage -->
        <div onclick="game.openLuxuryFacility('garage')" class="btn-press group relative h-28 rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-slate-800 bg-slate-900 hover:border-slate-600 transition">
          <img src="images/facility_garage.jpg" alt="Garage" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-black/20 flex flex-col justify-end p-1.5 text-center">
            <div class="text-xs font-black text-white drop-shadow">Garage</div>
            <div class="text-[9px] text-slate-300 font-bold mt-0.5">${garageCount} aset</div>
          </div>
        </div>

        <!-- Hangar -->
        <div onclick="game.openLuxuryFacility('hangar')" class="btn-press group relative h-28 rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-slate-800 bg-slate-900 hover:border-slate-600 transition">
          <img src="images/facility_hangar.jpg" alt="Hangar" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-black/20 flex flex-col justify-end p-1.5 text-center">
            <div class="text-xs font-black text-white drop-shadow">Hangar</div>
            <div class="text-[9px] text-slate-300 font-bold mt-0.5">${hangarCount} aset</div>
          </div>
        </div>

        <!-- Harbor -->
        <div onclick="game.openLuxuryFacility('harbor')" class="btn-press group relative h-28 rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-slate-800 bg-slate-900 hover:border-slate-600 transition">
          <img src="images/facility_harbor.jpg" alt="Harbor" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-black/20 flex flex-col justify-end p-1.5 text-center">
            <div class="text-xs font-black text-white drop-shadow">Harbor</div>
            <div class="text-[9px] text-slate-300 font-bold mt-0.5">${harborCount} aset</div>
          </div>
        </div>

        <!-- Island (Pulau Pribadi) -->
        <div onclick="game.openLuxuryFacility('island')" class="btn-press group relative h-28 rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-teal-500/40 bg-slate-900 hover:border-teal-400 transition">
          <img src="images/facility_island.jpg" alt="Island" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute inset-0 bg-gradient-to-t from-teal-950/95 via-teal-950/30 to-black/20 flex flex-col justify-end p-1.5 text-center">
            <div class="text-xs font-black text-white drop-shadow">Island</div>
            <div class="text-[9px] text-teal-200 font-bold mt-0.5">${islandCount} pulau</div>
          </div>
        </div>
      </div>

      <!-- 3. Showrooms Row (Car Showroom, Aircraft Shop, Yacht Shop, Island Shop) -->
      <div class="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-1.5 flex gap-1 shadow-md">
        <button onclick="game.openLuxuryShop('car')" class="btn-press flex-1 py-2 px-0.5 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-800 text-slate-300 transition">
          <svg class="w-6 h-6 text-slate-300 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l1-4h16l1 4M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M8 14h.01M16 14h.01M9 18h6"/>
          </svg>
          <span class="text-[10px] font-bold text-center leading-tight">Car Showroom</span>
        </button>

        <button onclick="game.openLuxuryShop('flight')" class="btn-press flex-1 py-2 px-0.5 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-800 text-slate-300 transition">
          <svg class="w-6 h-6 text-slate-300 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 21h18M4 18V8l8-5 8 5v10M12 7v10M8 12l4 3 4-3"/>
          </svg>
          <span class="text-[10px] font-bold text-center leading-tight">Aircraft Shop</span>
        </button>

        <button onclick="game.openLuxuryShop('yacht')" class="btn-press flex-1 py-2 px-0.5 rounded-xl flex flex-col items-center justify-center gap-1 bg-blue-600/30 text-blue-200 border border-blue-500/40 hover:bg-blue-600/40 transition">
          <svg class="w-6 h-6 text-blue-300 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M2 17l20 2-4-8-7-6-1 7-4 5zM4 21c3-1 6-1 8 0 3-1 6-1 8 0"/>
          </svg>
          <span class="text-[10px] font-bold text-center leading-tight">Yacht Shop</span>
        </button>

        <button onclick="game.openLuxuryShop('island')" class="btn-press flex-1 py-2 px-0.5 rounded-xl flex flex-col items-center justify-center gap-1 bg-teal-600/20 text-teal-200 border border-teal-500/30 hover:bg-teal-600/40 transition">
          <div class="text-xl leading-none">🏝️</div>
          <span class="text-[10px] font-bold text-center leading-tight">Island Shop</span>
        </button>
      </div>

      <!-- 4. Residence (Split Card: Mansion on Left, Teal Status Box on Right) -->
      <div onclick="game.openLuxuryResidence()" class="btn-press group relative rounded-2xl overflow-hidden border border-teal-500/30 shadow-xl cursor-pointer hover:border-teal-400/60 transition flex flex-row h-36">
        <!-- Left: Mansion Photo -->
        <div class="w-[44%] relative overflow-hidden bg-slate-900">
          <img src="images/residence_mansion.jpg" alt="Residence" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        </div>

        <!-- Right: Teal Gradient Box -->
        <div class="w-[56%] bg-gradient-to-br from-[#0e5c74] via-[#0b4d63] to-[#043344] p-3 flex flex-col justify-between text-white">
          <div class="text-center font-bold text-teal-100 text-xs tracking-wider">
            Residence
          </div>

          <!-- Milestones Row -->
          <div class="space-y-1">
            <div class="flex items-center justify-around text-xs">
              <span title="Gold Tier" class="${resLevel >= 1 ? 'opacity-100 scale-110' : 'opacity-40'} transition">🧱</span>
              <span title="Silver Tier" class="${resLevel >= 4 ? 'opacity-100 scale-110' : 'opacity-40'} transition">🏛️</span>
              <span title="Diamond Tier" class="${resLevel >= 7 ? 'opacity-100 scale-110' : 'opacity-40'} transition">💎</span>
            </div>
            <div class="grid grid-cols-3 gap-1">
              <div class="h-1 rounded-full ${resLevel >= 1 ? 'bg-amber-400' : 'bg-teal-900/60'}"></div>
              <div class="h-1 rounded-full ${resLevel >= 4 ? 'bg-slate-200' : 'bg-teal-900/60'}"></div>
              <div class="h-1 rounded-full ${resLevel >= 7 ? 'bg-cyan-400' : 'bg-teal-900/60'}"></div>
            </div>
          </div>

          <!-- Level & Valuation -->
          <div class="text-center space-y-0.5">
            <div class="text-sm font-black text-teal-200 flex items-center justify-center gap-1">
              <span class="text-base font-bold">⇧</span>
              <span>${resLevel}</span>
            </div>
            <div class="text-base font-black text-white tracking-tight drop-shadow">
              ${this.formatCompact(resTier.price)}
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Collections (2-Column Grid of 6 Categories) -->
      <div class="space-y-2 pt-1">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-black text-white">Collections</h2>
          <span class="text-[11px] text-slate-400 font-semibold">${coinsCount + paintingsCount + uniqueCount + retroCount + jewelsCount + stampsCount} of 105 total</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Coins -->
          <div onclick="game.openLuxuryCollection('coins')" class="btn-press group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-md">
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-4xl mb-2 group-hover:scale-110 transition-transform">
              🪙
            </div>
            <div class="font-bold text-white text-sm">Coins</div>
            <div class="text-xs text-slate-400 font-medium mt-0.5">${coinsCount} of 20</div>
          </div>

          <!-- Paintings -->
          <div onclick="game.openLuxuryCollection('paintings')" class="btn-press group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-md">
            <div class="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-4xl mb-2 group-hover:scale-110 transition-transform">
              🎨
            </div>
            <div class="font-bold text-white text-sm">Paintings</div>
            <div class="text-xs text-slate-400 font-medium mt-0.5">${paintingsCount} of 25</div>
          </div>

          <!-- Unique items -->
          <div onclick="game.openLuxuryCollection('unique')" class="btn-press group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-md">
            <div class="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-4xl mb-2 group-hover:scale-110 transition-transform">
              🔮
            </div>
            <div class="font-bold text-white text-sm">Unique items</div>
            <div class="text-xs text-slate-400 font-medium mt-0.5">${uniqueCount} of 5</div>
          </div>

          <!-- Retro cars -->
          <div onclick="game.openLuxuryCollection('retro_cars')" class="btn-press group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-md">
            <div class="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-4xl mb-2 group-hover:scale-110 transition-transform">
              🚗
            </div>
            <div class="font-bold text-white text-sm">Retro cars</div>
            <div class="text-xs text-slate-400 font-medium mt-0.5">${retroCount} of 20</div>
          </div>

          <!-- Jewels -->
          <div onclick="game.openLuxuryCollection('jewels')" class="btn-press group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-md">
            <div class="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-4xl mb-2 group-hover:scale-110 transition-transform">
              👑
            </div>
            <div class="font-bold text-white text-sm">Jewels</div>
            <div class="text-xs text-slate-400 font-medium mt-0.5">${jewelsCount} of 20</div>
          </div>

          <!-- Stamps -->
          <div onclick="game.openLuxuryCollection('stamps')" class="btn-press group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-md">
            <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-4xl mb-2 group-hover:scale-110 transition-transform">
              📮
            </div>
            <div class="font-bold text-white text-sm">Stamps</div>
            <div class="text-xs text-slate-400 font-medium mt-0.5">${stampsCount} of 15</div>
          </div>
        </div>
      </div>
    `;
  },

  renderLuxurySubView() {
    const container = document.getElementById('luxury-view-sub');
    if (!container || !this.luxurySubView) return;

    const sub = this.luxurySubView;

    // Header Back Button template
    const renderSubHeader = (title, subtitle = '') => `
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <button onclick="game.closeLuxurySubView()" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          <span>Items</span>
        </button>
        <div class="text-right">
          <h2 class="text-sm font-black text-white">${title}</h2>
          ${subtitle ? `<div class="text-[10px] text-amber-400 font-semibold">${subtitle}</div>` : ''}
        </div>
      </div>
    `;

    // 1. Facility Sub-View
    if (sub.type === 'facility') {
      const facilityTitles = {
        garage: 'Garage (Garasi Mobil & Motor)',
        hangar: 'Hangar (Armada Pesawat & Heli)',
        harbor: 'Harbor (Dermaga Yacht & Superyacht)',
        island: 'Island Sanctuary (Koleksi Pulau Pribadi)'
      };
      const title = facilityTitles[sub.facility] || 'Facility';

      const filterType = lux => {
        if (sub.facility === 'garage') return lux.type === 'car' || lux.type === 'moto';
        if (sub.facility === 'hangar') return lux.type === 'flight';
        if (sub.facility === 'harbor') return lux.type === 'yacht';
        if (sub.facility === 'island') return lux.type === 'island';
        return true;
      };

      const shopMapping = { garage: 'car', hangar: 'flight', harbor: 'yacht', island: 'island' };
      const targetShop = shopMapping[sub.facility] || 'car';

      const owned = (this.state.luxury || []).map(id => LUXURY_CATALOG.find(x => x.id === id)).filter(Boolean).filter(filterType);

      let html = renderSubHeader(title, `${owned.length} Aset Dimiliki`);

      if (owned.length === 0) {
        const facilityIcons = { garage: '🏎️', hangar: '✈️', harbor: '🛥️', island: '🏝️' };
        const facilityShopNames = { car: 'Car Showroom', flight: 'Aircraft Shop', yacht: 'Yacht Shop', island: 'Island Shop' };
        html += `
          <div class="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3 mt-4">
            <div class="text-4xl">${facilityIcons[sub.facility] || '🏝️'}</div>
            <h3 class="font-bold text-white text-sm">${title} Masih Kosong</h3>
            <p class="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              ${sub.facility === 'island' 
                ? 'Anda belum memiliki pulau pribadi sendiri. Kunjungi Island Shop untuk memiliki pulau atol karang, laguna tropis, hingga megastruktur pulau buatan!' 
                : 'Anda belum memarkir aset di fasilitas ini. Kunjungi showroom untuk memilih dan membeli armada prestisius!'}
            </p>
            <button onclick="game.openLuxuryShop('${targetShop}')" class="btn-press px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20">
              🛒 Buka ${facilityShopNames[targetShop] || 'Showroom'}
            </button>
          </div>
        `;
      } else {
        html += `<div class="space-y-3 mt-3">`;
        owned.forEach(lux => {
          const sellVal = Math.round(lux.price * 0.75);
          html += `
            <div class="glass-panel rounded-2xl border border-amber-400/40 bg-gradient-to-b from-amber-500/10 to-transparent overflow-hidden shadow-lg card-transition">
              <div class="relative h-36 w-full bg-slate-800 overflow-hidden">
                <img src="${lux.image}" alt="${lux.name}" class="w-full h-full object-cover" onerror="this.src='images/facility_island.jpg'">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                <div class="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-[11px] font-bold text-amber-300">
                  <span>⭐</span>
                  <span>+${lux.prestige.toLocaleString()} Prestise</span>
                </div>
                <div class="absolute bottom-2 left-3 right-3">
                  <div class="text-[11px] text-amber-300 font-semibold uppercase">${lux.category}</div>
                  <h4 class="font-black text-white text-base leading-tight drop-shadow-md">${lux.name}</h4>
                </div>
              </div>

              <div class="p-3 pt-2.5 flex items-center justify-between gap-3">
                <div>
                  <div class="text-[11px] text-slate-400">Valuasi Saat Ini</div>
                  <div class="font-extrabold text-white text-sm">${this.formatMoney(lux.price)}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">✓ Dimiliki</span>
                  <button onclick="game.sellLuxury('${lux.id}')" class="btn-press px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold" title="Jual kembali seharga 75% nilai perolehan">
                    Jual (${this.formatCompact(sellVal)})
                  </button>
                </div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
      }
      container.innerHTML = html;
      return;
    }

    // 2. Shop Sub-View
    if (sub.type === 'shop') {
      const shopTitles = {
        car: 'Car Showroom (Mobil & Motor Sport)',
        flight: 'Aircraft Shop (Jet Pribadi & Helikopter)',
        yacht: 'Yacht Shop (Yacht & Superyacht Mewah)',
        island: 'Island Shop (Agensi Pulau Pribadi Dunia)'
      };
      const title = shopTitles[sub.shopType] || 'Showroom';

      const filterType = lux => {
        if (sub.shopType === 'car') return lux.type === 'car' || lux.type === 'moto';
        if (sub.shopType === 'flight') return lux.type === 'flight';
        if (sub.shopType === 'yacht') return lux.type === 'yacht';
        if (sub.shopType === 'island') return lux.type === 'island';
        return true;
      };

      const catalog = LUXURY_CATALOG.filter(filterType);

      let html = renderSubHeader(title, `${catalog.length} ${sub.shopType === 'island' ? 'Pulau' : 'Model'} Tersedia`);
      html += `<div class="space-y-3 mt-3">`;

      catalog.forEach(lux => {
        const isOwned = (this.state.luxury || []).includes(lux.id);
        const canAfford = this.state.cash >= lux.price;

        html += `
          <div class="glass-panel rounded-2xl border ${isOwned ? 'border-amber-400/40 bg-gradient-to-b from-amber-500/5 to-transparent' : 'border-slate-800'} overflow-hidden shadow-lg card-transition">
            <div class="relative h-36 w-full bg-slate-800 overflow-hidden">
              <img src="${lux.image}" alt="${lux.name}" class="w-full h-full object-cover" onerror="this.src='images/facility_island.jpg'">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              
              <div class="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-amber-500/40 text-[11px] font-bold text-amber-300">
                <span>⭐</span>
                <span>+${lux.prestige.toLocaleString()} Prestise</span>
              </div>

              <div class="absolute bottom-2 left-3 right-3">
                <div class="text-[11px] text-amber-300 font-semibold uppercase">${lux.category}</div>
                <h4 class="font-black text-white text-base leading-tight drop-shadow-md">${lux.name}</h4>
              </div>
            </div>

            <div class="p-3 pt-2.5 flex items-center justify-between gap-3">
              <div>
                <div class="text-[11px] text-slate-400">Harga Beli Baru</div>
                <div class="font-extrabold text-white text-sm">${this.formatMoney(lux.price)}</div>
              </div>

              <div>
                ${isOwned ? `
                  <span class="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black flex items-center gap-1.5 shadow-sm">
                    <span>✓</span> Dimiliki
                  </span>
                ` : `
                  <button onclick="game.buyLuxury('${lux.id}')" class="btn-press px-4 py-2 rounded-xl text-xs font-black transition ${
                    canAfford
                      ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }">
                    Beli (${this.formatCompact(lux.price)})
                  </button>
                `}
              </div>
            </div>
          </div>
        `;
      });
      html += `</div>`;
      container.innerHTML = html;
      return;
    }

    // 3. Residence Sub-View
    if (sub.type === 'residence') {
      const curLevel = this.state.residenceLevel || 1;
      const curTier = (typeof RESIDENCE_TIERS !== 'undefined' && RESIDENCE_TIERS[curLevel - 1]) || { name: 'Studio Penthouse', price: 2500000000, prestige: 100 };
      const nextTier = typeof RESIDENCE_TIERS !== 'undefined' ? RESIDENCE_TIERS[curLevel] : null;

      let html = renderSubHeader('Residence Manager', `Tingkat ${curLevel} dari ${RESIDENCE_TIERS.length}`);

      // Hero Card of Current Residence
      html += `
        <div class="glass-panel rounded-2xl border border-teal-500/40 overflow-hidden mt-3 shadow-xl">
          <div class="relative h-44 w-full bg-slate-900 overflow-hidden">
            <img src="images/residence_mansion.jpg" alt="Mansion" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            <div class="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-teal-950/80 backdrop-blur-md border border-teal-400/50 text-[11px] font-bold text-teal-300">
              Level ${curLevel}: ${curTier.name}
            </div>
            <div class="absolute bottom-2 left-3 right-3 flex items-center justify-between">
              <div>
                <div class="text-[10px] text-teal-300 uppercase font-bold tracking-wider">Valuasi Hunian</div>
                <div class="text-xl font-black text-white drop-shadow">${this.formatMoney(curTier.price)}</div>
              </div>
              <div class="text-right">
                <div class="text-[10px] text-amber-300 uppercase font-bold tracking-wider">Prestise</div>
                <div class="text-base font-black text-amber-400">⭐ +${(curTier.prestige || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <!-- Upgrade Next Tier Section -->
          <div class="p-4 bg-slate-900/90 border-t border-slate-800">
            ${nextTier ? `
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Upgrade Berikutnya</span>
                    <h4 class="font-black text-white text-sm">Level ${curLevel + 1}: ${nextTier.name}</h4>
                  </div>
                  <div class="text-right">
                    <span class="text-[10px] text-slate-400 uppercase font-bold">Prestise Baru</span>
                    <div class="text-xs font-black text-amber-400">⭐ +${nextTier.prestige.toLocaleString()}</div>
                  </div>
                </div>

                <button onclick="game.upgradeResidence()" class="btn-press w-full py-2.5 rounded-xl font-black text-xs transition ${
                  this.state.cash >= nextTier.price
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-lg shadow-teal-500/20 hover:brightness-110'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }">
                  Tingkatkan Hunian (${this.formatCompact(nextTier.price)})
                </button>
              </div>
            ` : `
              <div class="text-center py-2 text-emerald-400 font-bold text-xs">
                🏆 Anda telah mencapai Tingkat Tempat Tinggal Tertinggi (Maharaja Estate)!
              </div>
            `}
          </div>
        </div>

        <!-- All Tiers Progression List -->
        <div class="space-y-2 mt-4">
          <h3 class="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Daftar Tingkat Tempat Tinggal</h3>
          <div class="space-y-2">
      `;

      RESIDENCE_TIERS.forEach(t => {
        const isCurrent = t.level === curLevel;
        const isUnlocked = t.level <= curLevel;
        html += `
          <div class="p-3 rounded-2xl border ${isCurrent ? 'bg-teal-500/10 border-teal-500/50' : (isUnlocked ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-950/40 border-slate-900 opacity-60')} flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-xl">${t.icon || '🏡'}</span>
              <div>
                <div class="font-bold text-xs text-white flex items-center gap-1.5">
                  <span>Level ${t.level}: ${t.name}</span>
                  ${isCurrent ? '<span class="px-1.5 py-0.5 rounded-md bg-teal-500/30 text-teal-300 text-[9px] font-black">Hadir</span>' : ''}
                </div>
                <div class="text-[10px] text-slate-400">${this.formatMoney(t.price)} • ⭐ +${t.prestige.toLocaleString()} prestise</div>
              </div>
            </div>
            <div>
              ${isUnlocked ? '<span class="text-emerald-400 font-bold text-xs">✓ Terbuka</span>' : '<span class="text-slate-500 text-xs">🔒 Terkunci</span>'}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;

      container.innerHTML = html;
      return;
    }

    // 4. Collection Sub-View
    if (sub.type === 'collection') {
      const collTitles = {
        coins: 'Koleksi Koin Kuno (Coins)',
        paintings: 'Galeri Mahakarya Lukisan (Paintings)',
        unique: 'Barang Unik & Artefak Langka (Unique items)',
        retro_cars: 'Koleksi Mobil Klasik Vintage (Retro cars)',
        jewels: 'Koleksi Perhiasan & Mahkota Monarki (Jewels)',
        stamps: 'Filateli Perangko Bersejarah (Stamps)'
      };
      const title = collTitles[sub.collKey] || 'Collections';
      const items = (typeof COLLECTIONS_CATALOG !== 'undefined' && COLLECTIONS_CATALOG[sub.collKey]) || [];
      const ownedIds = (this.state.collections && this.state.collections[sub.collKey]) || [];

      let html = renderSubHeader(title, `${ownedIds.length} of ${items.length} Dikoleksi`);
      html += `<div class="space-y-2.5 mt-3">`;

      items.forEach(it => {
        const isOwned = ownedIds.includes(it.id);
        const canAfford = this.state.cash >= it.price;
        const sellVal = Math.round(it.price * 0.75);

        html += `
          <div class="glass-panel p-3.5 rounded-2xl border ${isOwned ? 'border-amber-400/40 bg-gradient-to-r from-amber-500/5 to-transparent' : 'border-slate-800/80'} flex items-center justify-between gap-3 shadow-md card-transition">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 overflow-hidden text-2xl">
                ${it.image ? `<img src="${it.image}" alt="${it.name}" class="w-full h-full object-cover">` : (it.icon || '💎')}
              </div>
              <div class="min-w-0">
                <div class="font-extrabold text-xs text-white truncate">${it.name}</div>
                <div class="text-[10px] text-amber-400 font-semibold mt-0.5">⭐ +${it.prestige.toLocaleString()} Prestise</div>
                <div class="text-[11px] font-bold text-slate-300">${this.formatMoney(it.price)}</div>
              </div>
            </div>

            <div class="shrink-0 flex items-center gap-1.5">
              ${isOwned ? `
                <span class="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">✓ Dimiliki</span>
                <button onclick="game.sellCollectionItem('${sub.collKey}', '${it.id}')" class="btn-press px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-[10px] font-bold">
                  Lelang (${this.formatCompact(sellVal)})
                </button>
              ` : `
                <button onclick="game.buyCollectionItem('${sub.collKey}', '${it.id}')" class="btn-press px-3.5 py-1.5 rounded-xl font-black text-xs transition ${
                  canAfford
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }">
                  Beli (${this.formatCompact(it.price)})
                </button>
              `}
            </div>
          </div>
        `;
      });

      html += `</div>`;
      container.innerHTML = html;
      return;
    }
  },

  renderStatsAndSettings() {
    const nw = this.calculateNetWorth();
    const rank = this.getCurrentRank();
    const hourly = this.calculateHourlyIncome();

    // Rincian Arus Kas Bersih per Jam
    const { rawBiz, rawStocks, rawProp } = this.getSectorRevenueBreakdown();
    const threshold = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.MANDATORY_THRESHOLD) || 25000000;
    const rate = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.RATE) || 0.05;

    let bizHourly = 0;
    if (!this.state.taxes?.business?.suspended) {
      bizHourly = rawBiz < threshold ? Math.round(rawBiz * (1 - rate)) : rawBiz;
    }
    let stocksHourly = 0;
    if (!this.state.taxes?.stocks?.suspended) {
      stocksHourly = rawStocks < threshold ? Math.round(rawStocks * (1 - rate)) : rawStocks;
    }
    let propHourly = 0;
    if (!this.state.taxes?.property?.suspended) {
      propHourly = rawProp < threshold ? Math.round(rawProp * (1 - rate)) : rawProp;
    }

    const stats = this.state.stats || {
      stockTradingProfit: 0,
      cryptoTradingProfit: 0,
      commodityTradingProfit: 0,
      dividendsEarned: 0,
      businessEarnings: 0,
      rentalEarnings: 0
    };

    const stockProfit = stats.stockTradingProfit || 0;
    const cryptoProfit = stats.cryptoTradingProfit || 0;
    const commodityProfit = stats.commodityTradingProfit || 0;
    const stockProfitClass = stockProfit > 0 ? 'text-emerald-400' : (stockProfit < 0 ? 'text-rose-400' : 'text-slate-400');
    const cryptoProfitClass = cryptoProfit > 0 ? 'text-emerald-400' : (cryptoProfit < 0 ? 'text-rose-400' : 'text-slate-400');
    const commodityProfitClass = commodityProfit > 0 ? 'text-emerald-400' : (commodityProfit < 0 ? 'text-rose-400' : 'text-slate-400');

    // Total Pajak yang dibayar
    let totalTaxPaid = 0;
    let anySuspended = false;
    if (this.state.taxes) {
      ['business', 'property', 'stocks'].forEach(sec => {
        const t = this.state.taxes[sec];
        if (t) {
          totalTaxPaid += (t.totalPaidLifetime || 0) + (t.totalAutoPaidLifetime || 0);
          if (t.suspended) anySuspended = true;
        }
      });
    }

    const totalPlayHours = Math.max(0, this.state.gameHours || 0);
    const playDays = Math.floor(totalPlayHours / 24);
    const playHours = Math.floor(totalPlayHours % 24);
    const playMins = Math.floor((totalPlayHours * 60) % 60);
    const leadTimeText = playDays > 0 
      ? `${playDays}h ${playHours}j ${playMins}m` 
      : (playHours > 0 ? `${playHours} Jam ${playMins} Menit` : `${playMins} Menit`);

    const statsContainer = document.getElementById('stats-summary-card');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="space-y-3 text-xs">
          
          <!-- 1. KARTU PROFIL UTAMA -->
          <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span class="text-slate-400 block text-[11px]">Gelar Konglomerat</span>
                <span class="text-base font-black text-white flex items-center gap-1.5 mt-0.5">${rank.badge} ${rank.title}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-400 block text-[11px]">Waktu Memimpin</span>
                <span class="text-xs font-bold text-slate-300 font-mono">${leadTimeText}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400 block text-[11px]">Total Kekayaan Bersih:</span>
                <span class="font-extrabold text-emerald-400 text-sm">${this.formatCompact(nw)}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <span class="text-slate-400 block text-[11px]">Kas Tunai Likuid:</span>
                <span class="font-bold text-white text-sm">${this.formatCompact(this.state.cash)}</span>
              </div>
            </div>
          </div>

          <!-- 2. KARTU RINCIAN TERPISAH: SUMBER PENDAPATAN & KEUNTUNGAN -->
          <div class="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 class="text-xs uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-1.5">
                <span>💰</span> Rincian Keuntungan & Pendapatan
              </h3>
              <span class="text-[10px] text-slate-400 font-semibold">Sepanjang Masa</span>
            </div>

            <div class="space-y-2">
              <!-- A. Pendapatan dari Bisnis -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-base">
                    🏢
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Pendapatan dari Bisnis</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Arus Kas:</span>
                      <span class="${bizHourly > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}">+${this.formatCompact(bizHourly)}/jam</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold text-emerald-400">${this.formatMoney(stats.businessEarnings || 0)}</div>
                  <span class="text-[10px] text-slate-500">${(this.state.businesses || []).length} unit usaha</span>
                </div>
              </div>

              <!-- B. Pendapatan dari Sewa Properti -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-base">
                    🏠
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Pendapatan Sewa Properti</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Arus Kas:</span>
                      <span class="${propHourly > 0 ? 'text-blue-400 font-semibold' : 'text-slate-500'}">+${this.formatCompact(propHourly)}/jam</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold text-blue-400">${this.formatMoney(stats.rentalEarnings || 0)}</div>
                  <span class="text-[10px] text-slate-500">Real estate sewa</span>
                </div>
              </div>

              <!-- C. Pendapatan Dividen Saham -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-base">
                    📊
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Pendapatan Dividen Saham</div>
                    <div class="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>Arus Kas:</span>
                      <span class="${stocksHourly > 0 ? 'text-teal-400 font-semibold' : 'text-slate-500'}">+${this.formatCompact(stocksHourly)}/jam</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold text-teal-400">${this.formatMoney(stats.dividendsEarned || 0)}</div>
                  <span class="text-[10px] text-slate-500">Bagi hasil emiten</span>
                </div>
              </div>

              <!-- D. Keuntungan Trading Saham (Capital Gain) -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-base">
                    📈
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Keuntungan Trading Saham</div>
                    <div class="text-[10px] text-slate-400">Capital Gain Realized</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold ${stockProfitClass}">${this.formatMoney(stockProfit)}</div>
                  <span class="text-[10px] text-slate-500">Jual-beli bursa saham</span>
                </div>
              </div>

              <!-- E. Keuntungan Trading Kripto (Capital Gain) -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-base">
                    🪙
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Keuntungan Trading Kripto</div>
                    <div class="text-[10px] text-slate-400">Capital Gain Realized</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold ${cryptoProfitClass}">${this.formatMoney(cryptoProfit)}</div>
                  <span class="text-[10px] text-slate-500">Jual-beli pasar kripto</span>
                </div>
              </div>

              <!-- F. Keuntungan Trading Komoditas (Long / Short) -->
              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-base">
                    🛢️
                  </div>
                  <div>
                    <div class="font-bold text-slate-200">Keuntungan Trading Komoditas</div>
                    <div class="text-[10px] text-slate-400">Kontrak Derivatif Long/Short</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-extrabold ${commodityProfitClass}">${this.formatMoney(commodityProfit)}</div>
                  <span class="text-[10px] text-slate-500">Bursa Komoditas Berjangka</span>
                </div>
              </div>
            </div>

            <!-- Total Penghasilan Bersih Sepanjang Masa -->
            <div class="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span class="text-slate-400">Total Penghasilan Sepanjang Masa:</span>
              <span class="font-black text-amber-300 text-sm">${this.formatMoney(this.state.totalEarnedLifetime)}</span>
            </div>
          </div>

          <!-- 3. KARTU KEPATUHAN PAJAK (DJP) -->
          <div class="glass-panel p-3.5 rounded-2xl border border-slate-800 space-y-2 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Total Pajak Disetor ke Negara:</span>
              <span class="font-bold text-slate-200">${this.formatMoney(totalTaxPaid)}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Status Kepatuhan Pajak:</span>
              <span class="font-bold ${anySuspended ? 'text-rose-400' : 'text-emerald-400'}">
                ${anySuspended ? '🚨 Ada Sanksi Suspensi' : '✅ Tertib Bebas Sanksi'}
              </span>
            </div>
          </div>

        </div>
      `;
    }
  }
});
