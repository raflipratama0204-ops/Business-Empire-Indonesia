// Business Empire: RichMan - Tax System Module (DJP & PPh Final)
Object.assign(GameEngine.prototype, {
  getBusinessTax(biz) {
    if (!biz) return { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 };
    if (!biz.tax) {
      biz.tax = { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 };
    }
    return biz.tax;
  },

  renderTaxWidget() {
    const container = document.getElementById('home-tax-widget');
    if (!container) return;

    if (!this.state.taxes) {
      this.state.taxes = {
        business: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 },
        property: { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 },
        stocks:   { unpaid: 0, deadline: null, suspended: false, totalPaidLifetime: 0, totalAutoPaidLifetime: 0 }
      };
    }

    const { rawStocks, rawProp } = this.getSectorRevenueBreakdown();
    const threshold = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.MANDATORY_THRESHOLD) || 25000000;
    const now = Date.now();

    const bizList = this.state.businesses || [];
    let totalBizUnpaid = 0;
    let anyBizSuspended = false;
    bizList.forEach(b => {
      const t = this.getBusinessTax(b);
      totalBizUnpaid += (t.unpaid || 0);
      if (t.suspended) anyBizSuspended = true;
    });

    const taxProp = this.state.taxes.property || { unpaid: 0, deadline: null, suspended: false };
    const taxStock = this.state.taxes.stocks || { unpaid: 0, deadline: null, suspended: false };

    const totalUnpaid = totalBizUnpaid + (taxProp.unpaid || 0) + (taxStock.unpaid || 0);
    const hasSuspended = anyBizSuspended || taxProp.suspended || taxStock.suspended;

    let globalStatusBadge = '';
    if (hasSuspended) {
      globalStatusBadge = `<span class="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 font-extrabold text-[11px] border border-rose-500/40 tax-warning-pulse flex items-center gap-1">🚨 SANKSI PEMBEKUAN AKTIF</span>`;
    } else if (totalUnpaid > 0) {
      globalStatusBadge = `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/40 flex items-center gap-1">⏳ SPT MASA PERLU DIBAYAR</span>`;
    } else {
      globalStatusBadge = `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] border border-emerald-500/40 flex items-center gap-1">✅ STATUS PAJAK TAAT</span>`;
    }

    const formatDeadline = (deadline, unpaid, isSuspended) => {
      if (isSuspended) {
        return `<span class="text-rose-400 font-black">LEWAT WAKTU (DISUSPEND)</span>`;
      }
      if (!unpaid || !deadline) {
        return `<span class="text-slate-400">Tidak ada tunggakan</span>`;
      }
      const remSec = Math.max(0, Math.ceil((deadline - now) / 1000));
      const hours = Math.floor(remSec / 3600);
      const mins = Math.floor((remSec % 3600) / 60);
      const secs = remSec % 60;
      let timeStr = '';
      if (hours > 0) {
        timeStr = `${hours}j ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}d`;
      } else {
        timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      const color = remSec <= 3600 ? 'text-rose-400 font-bold tax-warning-pulse' : 'text-amber-400 font-bold';
      return `<span class="${color}" data-tax-timer="${deadline}">${timeStr}</span>`;
    };

    const renderSectorCard = (title, icon, rawIncome, taxObj, sectorKey) => {
      const isMandatory = rawIncome >= threshold;
      const isSuspended = taxObj.suspended;
      const unpaid = taxObj.unpaid || 0;

      let modeBadge = '';
      if (isSuspended) {
        modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">DIBEKUKAN DJP</span>`;
      } else if (isMandatory) {
        modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">Wajib Bayar Mandiri (5%)</span>`;
      } else {
        modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">Otomatis Net 95%</span>`;
      }

      return `
        <div class="p-3 rounded-xl bg-slate-950/80 border ${isSuspended ? 'tax-suspended-glow border-rose-500/80' : (unpaid > 0 ? 'border-amber-500/40' : 'border-slate-800')} space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5 font-bold text-white text-xs">
              <span>${icon}</span>
              <span>${title}</span>
            </div>
            ${modeBadge}
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span class="text-slate-400 block text-[10px]">Pendapatan Kotor:</span>
              <span class="font-bold text-slate-200">${rawIncome >= 0 ? '+' : ''}${this.formatCompact(rawIncome)}/jam</span>
            </div>
            <div>
              <span class="text-slate-400 block text-[10px]">Tagihan Pajak Terhutang:</span>
              <span class="font-bold ${unpaid > 0 ? (isSuspended ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}">
                ${unpaid > 0 ? this.formatMoney(unpaid) : (isMandatory ? 'Rp 0' : 'Auto 5% Terpotong')}
              </span>
            </div>
          </div>

          ${isMandatory || unpaid > 0 || isSuspended ? `
            <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
              <span class="text-slate-400">Jatuh Tempo:</span>
              ${formatDeadline(taxObj.deadline, unpaid, isSuspended)}
            </div>
            <button onclick="game.payTax('${sectorKey}')" ${unpaid <= 0 ? 'disabled' : ''} class="btn-press w-full mt-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${unpaid > 0 ? (isSuspended ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-md shadow-rose-500/20' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20') : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
              <span>Bayar Pajak ${unpaid > 0 ? '(' + this.formatCompact(unpaid) + ')' : ''}</span>
            </button>
          ` : `
            <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
              ✓ Omzet di bawah ${this.formatCompact(threshold)}/jam, pajak 5% otomatis terpotong saat jam game berganti.
            </div>
          `}
        </div>
      `;
    };

    const bizCardsHtml = bizList.length === 0
      ? `<div class="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-center text-xs text-slate-400">Belum ada bisnis yang didirikan.</div>`
      : bizList.map(biz => {
          const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId) || { name: 'Bisnis', icon: '🏢' };
          const rawIncome = this.calculateSingleBusinessRevenue(biz);
          const taxObj = this.getBusinessTax(biz);
          const unpaid = taxObj.unpaid || 0;
          const isSuspended = taxObj.suspended;
          const isMandatory = rawIncome >= threshold;

          let modeBadge = '';
          if (isSuspended) {
            modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">DIBEKUKAN DJP</span>`;
          } else if (isMandatory) {
            modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">Wajib Mandiri (5%)</span>`;
          } else {
            modeBadge = `<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">Otomatis Net 95%</span>`;
          }

          return `
            <div class="p-3 rounded-xl bg-slate-950/80 border ${isSuspended ? 'tax-suspended-glow border-rose-500/80' : (unpaid > 0 ? 'border-amber-500/40' : 'border-slate-800')} space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 font-bold text-white text-xs">
                  <span>${sector.icon}</span>
                  <span class="truncate max-w-[170px]">${biz.name}</span>
                  <span class="text-[10px] text-slate-400 font-normal">(${sector.name})</span>
                </div>
                ${modeBadge}
              </div>

              <div class="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span class="text-slate-400 block text-[10px]">Pendapatan Kotor:</span>
                  <span class="font-bold text-slate-200">${rawIncome >= 0 ? '+' : ''}${this.formatCompact(rawIncome)}/jam</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">Tagihan Pajak Terhutang:</span>
                  <span class="font-bold ${unpaid > 0 ? (isSuspended ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}">
                    ${unpaid > 0 ? this.formatMoney(unpaid) : (isMandatory ? 'Rp 0' : 'Auto 5% Terpotong')}
                  </span>
                </div>
              </div>

              ${isMandatory || unpaid > 0 || isSuspended ? `
                <div class="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
                  <span class="text-slate-400">Jatuh Tempo (72 Jam):</span>
                  ${formatDeadline(taxObj.deadline, unpaid, isSuspended)}
                </div>
                <button onclick="game.payBusinessTax('${biz.instanceId}')" ${unpaid <= 0 ? 'disabled' : ''} class="btn-press w-full mt-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${unpaid > 0 ? (isSuspended ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-md shadow-rose-500/20' : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20') : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
                  <span>Bayar Pajak ${unpaid > 0 ? '(' + this.formatCompact(unpaid) + ')' : ''}</span>
                </button>
              ` : `
                <div class="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                  ✓ Omzet di bawah ${this.formatCompact(threshold)}/jam, pajak 5% otomatis terpotong saat jam game berganti.
                </div>
              `}
            </div>
          `;
        }).join('');

    container.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-base">
            🏛️
          </div>
          <div>
            <h3 class="text-xs uppercase tracking-wider font-extrabold text-white">KPP & Kepatuhan Fiskal (DJP)</h3>
            <span class="text-[10px] text-slate-400">Tarif 5% Per Jam Game • Tenggat 72 Jam</span>
          </div>
        </div>
        ${globalStatusBadge}
      </div>

      <!-- Ringkasan Total Tagihan & Aksi Bayar Semua -->
      <div class="p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
          <span class="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Pajak Terhutang</span>
          <div class="text-lg font-black ${totalUnpaid > 0 ? (hasSuspended ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'}">
            ${this.formatMoney(totalUnpaid)}
          </div>
        </div>
        ${totalUnpaid > 0 ? `
          <button onclick="game.payAllTaxes()" class="btn-press px-4 py-2 rounded-xl ${hasSuspended ? 'bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'} font-black text-xs shadow-md flex items-center gap-1.5">
            <span>💳 Lunasi Semua Pajak</span>
          </button>
        ` : `
          <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            Bebas Tunggakan ✨
          </span>
        `}
      </div>

      <!-- Sektor Pajak Bisnis Komersial (Per Bisnis) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between pt-1">
          <span class="text-xs uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-1.5">
            <span>🏢</span> Pajak Bisnis Komersial (${bizList.length} Entitas)
          </span>
          <span class="text-[11px] font-mono text-amber-400 font-bold">
            ${totalBizUnpaid > 0 ? this.formatMoney(totalBizUnpaid) : 'Rp 0'}
          </span>
        </div>
        ${bizCardsHtml}
      </div>

      <!-- Sektor Investasi & Properti -->
      <div class="space-y-2 pt-2 border-t border-slate-800/80">
        <span class="text-xs uppercase tracking-wider font-extrabold text-slate-300 flex items-center gap-1.5">
          <span>💼</span> Pajak Investasi & Properti
        </span>
        ${renderSectorCard('Sewa Properti', '🏠', rawProp, taxProp, 'property')}
        ${renderSectorCard('Dividen Portofolio Saham', '📈', rawStocks, taxStock, 'stocks')}
      </div>

      <!-- Ketentuan Peraturan Pajak -->
      <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
        <div class="font-bold text-slate-300 flex items-center gap-1">
          <span>📜 Ketentuan Kebijakan Fiskal DJP:</span>
        </div>
        <div>• <strong>Tarif Pajak:</strong> Flat 5% dari pendapatan usahanya setiap jam game (berbasis 1 jam dunia nyata).</div>
        <div>• <strong>Pajak Terpisah Per Bisnis:</strong> Masing-masing perusahaan memiliki catatan pajak mandiri dan dapat dibayar terpisah.</div>
        <div>• <strong>Usaha Pemula (&lt; Rp 25 Jt/jam):</strong> Pajak 5% dipotong otomatis dari kas masuk (PPh Final net 95%).</div>
        <div>• <strong>Usaha Besar (&ge; Rp 25 Jt/jam):</strong> Wajib bayar mandiri dengan batas jatuh tempo <strong>72 jam dunia nyata (3 hari)</strong>.</div>
        <div>• <strong>Sanksi Suspensi:</strong> Jika melewati batas 72 jam belum dibayar, operasional bisnis terkait DIBEKUKAN sampai pajak dilunasi.</div>
      </div>
    `;
  },

  updateLiveTaxTimers() {
    const now = Date.now();
    document.querySelectorAll('[data-tax-timer]').forEach(el => {
      const deadline = parseInt(el.getAttribute('data-tax-timer'), 10);
      if (isNaN(deadline) || deadline <= 0) return;
      const remSec = Math.max(0, Math.ceil((deadline - now) / 1000));
      if (remSec === 0) {
        el.textContent = 'LEWAT WAKTU (DISUSPEND)';
        el.className = 'text-rose-400 font-black';
      } else {
        const hours = Math.floor(remSec / 3600);
        const mins = Math.floor((remSec % 3600) / 60);
        const secs = remSec % 60;
        if (hours > 0) {
          el.textContent = `${hours}j ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}d`;
        } else {
          el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        if (remSec <= 3600) {
          el.className = 'text-rose-400 font-bold tax-warning-pulse';
        } else {
          el.className = 'text-amber-400 font-bold';
        }
      }
    });
  },

  payBusinessTax(instanceId) {
    const biz = this.state.businesses.find(b => b.instanceId === instanceId);
    if (!biz) return;
    const taxObj = this.getBusinessTax(biz);
    const amount = taxObj.unpaid || 0;

    if (amount <= 0) {
      this.showToast(`Tidak ada tunggakan pajak untuk bisnis "${biz.name}".`, 'info');
      return;
    }

    if (this.state.cash < amount) {
      window.sound.playError();
      this.showToast(`Kas tunai tidak cukup! Butuh ${this.formatMoney(amount)} untuk melunasi pajak bisnis ini.`, 'error');
      return;
    }

    this.state.cash -= amount;
    taxObj.totalPaidLifetime = (taxObj.totalPaidLifetime || 0) + amount;
    taxObj.unpaid = 0;
    taxObj.deadline = null;
    const wasSuspended = taxObj.suspended;
    taxObj.suspended = false;

    window.sound.playCash();
    if (wasSuspended) {
      this.showToast(`✅ Pembayaran pajak bisnis "${biz.name}" sebesar ${this.formatMoney(amount)} BERHASIL! Sanksi suspensi resmi DICABUT dan operasional kembali aktif!`, 'success');
    } else {
      this.showToast(`✅ Pembayaran pajak bisnis "${biz.name}" sebesar ${this.formatMoney(amount)} BERHASIL disetorkan ke Kas Negara!`, 'success');
    }

    this.saveGame();
    this.render();
  },

  payTax(sector) {
    if (sector === 'business') {
      let totalBizDue = 0;
      if (Array.isArray(this.state.businesses)) {
        this.state.businesses.forEach(b => {
          totalBizDue += (this.getBusinessTax(b).unpaid || 0);
        });
      }
      if (totalBizDue <= 0) {
        this.showToast('Tidak ada tagihan pajak bisnis yang perlu dibayar.', 'info');
        return;
      }
      if (this.state.cash < totalBizDue) {
        window.sound.playError();
        this.showToast(`Kas tunai tidak cukup! Butuh ${this.formatMoney(totalBizDue)} untuk melunasi seluruh pajak bisnis.`, 'error');
        return;
      }
      this.state.cash -= totalBizDue;
      let hadSuspended = false;
      this.state.businesses.forEach(b => {
        const t = this.getBusinessTax(b);
        if (t.unpaid > 0) {
          if (t.suspended) hadSuspended = true;
          t.totalPaidLifetime = (t.totalPaidLifetime || 0) + t.unpaid;
          t.unpaid = 0;
          t.deadline = null;
          t.suspended = false;
        }
      });
      window.sound.playCash();
      if (hadSuspended) {
        this.showToast(`✅ Pembayaran seluruh pajak bisnis (${this.formatMoney(totalBizDue)}) BERHASIL! Seluruh sanksi suspensi bisnis dicabut!`, 'success');
      } else {
        this.showToast(`✅ Pembayaran seluruh pajak bisnis (${this.formatMoney(totalBizDue)}) BERHASIL disetorkan!`, 'success');
      }
      this.saveGame();
      this.render();
      return;
    }

    if (!this.state.taxes || !this.state.taxes[sector]) return;
    const taxObj = this.state.taxes[sector];
    const amount = taxObj.unpaid || 0;

    if (amount <= 0) {
      this.showToast('Tidak ada tagihan pajak untuk sektor ini.', 'info');
      return;
    }

    if (this.state.cash < amount) {
      window.sound.playError();
      this.showToast(`Kas tunai tidak cukup! Butuh ${this.formatMoney(amount)} untuk melunasi pajak.`, 'error');
      return;
    }

    this.state.cash -= amount;
    taxObj.totalPaidLifetime = (taxObj.totalPaidLifetime || 0) + amount;
    taxObj.unpaid = 0;
    taxObj.deadline = null;
    const wasSuspended = taxObj.suspended;
    taxObj.suspended = false;

    window.sound.playCash();
    const secName = sector === 'property' ? 'Sewa Properti' : 'Dividen Saham';
    if (wasSuspended) {
      this.showToast(`✅ Pembayaran pajak ${secName} sebesar ${this.formatMoney(amount)} BERHASIL! Sanksi suspensi resmi DICABUT dan pendapatan kembali aktif!`, 'success');
    } else {
      this.showToast(`✅ Pembayaran pajak ${secName} sebesar ${this.formatMoney(amount)} BERHASIL! SPT Masa telah disetorkan ke Kas Negara.`, 'success');
    }

    this.saveGame();
    this.render();
  },

  payAllTaxes() {
    let totalDue = 0;
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(b => {
        totalDue += (this.getBusinessTax(b).unpaid || 0);
      });
    }
    ['property', 'stocks'].forEach(s => {
      if (this.state.taxes && this.state.taxes[s]) {
        totalDue += (this.state.taxes[s].unpaid || 0);
      }
    });

    if (totalDue <= 0) {
      this.showToast('Seluruh kewajiban pajak Anda telah lunas!', 'info');
      return;
    }

    if (this.state.cash < totalDue) {
      window.sound.playError();
      this.showToast(`Kas tunai tidak cukup! Butuh total ${this.formatMoney(totalDue)} untuk melunasi seluruh pajak.`, 'error');
      return;
    }

    this.state.cash -= totalDue;
    let hadSuspended = false;

    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(b => {
        const t = this.getBusinessTax(b);
        if (t.unpaid > 0) {
          if (t.suspended) hadSuspended = true;
          t.totalPaidLifetime = (t.totalPaidLifetime || 0) + t.unpaid;
          t.unpaid = 0;
          t.deadline = null;
          t.suspended = false;
        }
      });
    }

    ['property', 'stocks'].forEach(s => {
      const taxObj = this.state.taxes[s];
      if (taxObj && taxObj.unpaid > 0) {
        if (taxObj.suspended) hadSuspended = true;
        taxObj.totalPaidLifetime = (taxObj.totalPaidLifetime || 0) + taxObj.unpaid;
        taxObj.unpaid = 0;
        taxObj.deadline = null;
        taxObj.suspended = false;
      }
    });

    window.sound.playCash();
    if (hadSuspended) {
      this.showToast(`✅ Seluruh pajak senilai ${this.formatMoney(totalDue)} LUNAS! Seluruh pembekuan/suspensi telah dicabut!`, 'success');
    } else {
      this.showToast(`✅ Seluruh pajak senilai ${this.formatMoney(totalDue)} LUNAS! Kerajaan bisnis Anda 100% taat aturan pajak!`, 'success');
    }

    this.saveGame();
    this.render();
  }
});
