// Business Empire: RichMan - Financial Calculations & Valuations Module
Object.assign(GameEngine.prototype, {
  getCurrentRank() {
    const netWorth = this.calculateNetWorth();
    let current = NET_WORTH_RANKS[0];
    for (const r of NET_WORTH_RANKS) {
      if (netWorth >= r.min) current = r;
    }
    return current;
  },

  calculateNetWorth() {
    let nw = this.state.cash;

    // Businesses & Fleets
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(biz => {
        nw += this.calculateBusinessValuation(biz);
      });
    }

    // Stocks
    for (const [sym, st] of Object.entries(this.state.stocks)) {
      if (st.shares > 0 && this.stockPrices[sym]) {
        nw += st.shares * this.stockPrices[sym];
      }
    }

    // Crypto
    for (const [sym, cr] of Object.entries(this.state.crypto)) {
      if (cr.amount > 0.00001 && this.cryptoPrices[sym]) {
        nw += cr.amount * this.cryptoPrices[sym];
      }
    }

    // Real Estate
    for (const [id, propVal] of Object.entries(this.state.properties)) {
      const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
      const count = typeof propVal === 'number' ? propVal : (propVal ? propVal.count : 0);
      if (prop && count > 0) {
        let singleVal = prop.price;
        if (typeof propVal === 'object') {
          if (propVal.furnished) singleVal += prop.furnitureCost;
          if (propVal.internet) singleVal += prop.internetCost;
        }
        nw += singleVal * count;
      }
    }

    // Luxury
    for (const id of this.state.luxury) {
      const lux = LUXURY_CATALOG.find(x => x.id === id);
      if (lux) nw += lux.price;
    }

    // Ekuitas Posisi Trading Komoditas (Margin + Floating PnL)
    if (Array.isArray(this.state.commodityPositions)) {
      this.state.commodityPositions.forEach(pos => {
        const curPrice = (this.commodityPrices && this.commodityPrices[pos.symbol]) || pos.entryPrice;
        const priceChange = (curPrice - pos.entryPrice) / pos.entryPrice;
        const pnlRate = (pos.type === 'LONG' ? priceChange : -priceChange) * (pos.leverage || 1);
        const equity = Math.max(0, Math.round(pos.margin * (1 + pnlRate)));
        nw += equity;
      });
    }

    return Math.max(0, nw);
  },

  calculateBusinessValuation(biz) {
    let val = 0;
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
    if (!sector) return 0;

    if (sector.hasSubtypes && biz.subTypeId) {
      const sub = sector.subtypes.find(st => st.id === biz.subTypeId);
      if (sub) val += sub.cost * biz.level;
    } else {
      val += (sector.baseCost || 50000000) * biz.level;
    }

    if (sector.isFleet && biz.vehicles) {
      biz.vehicles.forEach(v => {
        const cat = TAXI_FLEET_VEHICLES.find(x => x.id === v.modelId);
        if (cat) val += cat.cost * Math.max(0.2, 1 - (v.km / cat.maxKm));
      });
      val += (biz.parkingCapacity - 10) * 5000000;
    }

    if (sector.isLogistics && biz.trucks) {
      biz.trucks.forEach(t => {
        const cat = LOGISTICS_FLEET_VEHICLES.find(x => x.id === t.modelId);
        if (cat) val += cat.cost * Math.max(0.2, 1 - (t.km / cat.maxKm));
      });
      val += (biz.warehouseCapacity || 2) * 250000000;
    }

    if (sector.isBank && biz.vault) {
      val += biz.vault;
    }

    if ((sector.isTech || biz.sectorId === 'tech') && biz.workstations) {
      val += ((biz.workstations || 15) - 15) * 35000000;
      val += (this.getTechTotalEmployees(biz) || 0) * 15000000;
    }

    if ((sector.isAirline || biz.sectorId === 'airline') && biz.planes) {
      if (typeof AIRLINE_AIRCRAFT_CATALOG !== 'undefined') {
        biz.planes.forEach(p => {
          const model = AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId);
          if (model) val += model.price * 0.9;
        });
      }
      if (typeof AIRLINE_ROUTES_CATALOG !== 'undefined' && biz.routes) {
        biz.routes.forEach(rId => {
          const r = AIRLINE_ROUTES_CATALOG.find(x => x.id === rId);
          if (r) val += r.unlockCost * 0.8;
        });
      }
    }

    if ((sector.isOil || biz.sectorId === 'oil') && biz.facilities) {
      if (typeof OIL_FACILITIES_CATALOG !== 'undefined') {
        biz.facilities.forEach(f => {
          const cat = OIL_FACILITIES_CATALOG.find(x => x.id === f.id);
          if (cat) val += cat.cost * (f.count || 1) * 0.9;
        });
      }
      if (typeof OIL_CONTRACTS_CATALOG !== 'undefined' && biz.contracts) {
        biz.contracts.forEach(cId => {
          const c = OIL_CONTRACTS_CATALOG.find(x => x.id === cId);
          if (c) val += c.cost * 0.8;
        });
      }
    }

    if ((sector.isMining || biz.sectorId === 'mining') && biz.facilities) {
      if (typeof MINING_FACILITIES_CATALOG !== 'undefined') {
        biz.facilities.forEach(f => {
          const cat = MINING_FACILITIES_CATALOG.find(x => x.id === f.id);
          if (cat) val += cat.cost * (f.count || 1) * 0.9;
        });
      }
      if (typeof MINING_CONTRACTS_CATALOG !== 'undefined' && biz.contracts) {
        biz.contracts.forEach(cId => {
          const c = MINING_CONTRACTS_CATALOG.find(x => x.id === cId);
          if (c) val += c.cost * 0.8;
        });
      }
    }

    return Math.round(val);
  },

  getOilProductionStats(biz) {
    if (!biz) return { totalOilBblPerHour: 0, totalGasBoePerHour: 0, totalContractRevenue: 0, signedContractsCount: 0, totalHourlyRevenue: 0 };

    const facilities = biz.facilities || [];
    const contracts = biz.contracts || [];

    let totalOilBblPerHour = 0;
    let totalGasBoePerHour = 0;

    facilities.forEach(f => {
      const cat = typeof OIL_FACILITIES_CATALOG !== 'undefined' ? OIL_FACILITIES_CATALOG.find(x => x.id === f.id) : null;
      if (cat) {
        totalOilBblPerHour += (cat.oilBblPerHour || 0) * (f.count || 1);
        totalGasBoePerHour += (cat.gasBoePerHour || 0) * (f.count || 1);
      }
    });

    let totalContractRevenue = 0;
    contracts.forEach(cId => {
      const c = typeof OIL_CONTRACTS_CATALOG !== 'undefined' ? OIL_CONTRACTS_CATALOG.find(x => x.id === cId) : null;
      if (c) {
        totalContractRevenue += c.hourlyRevenue || 0;
      }
    });

    const baseRevenue = 1200000000; // Rp 1,2 Miliar starter
    const totalHourlyRevenue = baseRevenue + totalContractRevenue;

    return {
      totalOilBblPerHour,
      totalGasBoePerHour,
      totalContractRevenue,
      signedContractsCount: contracts.length,
      totalHourlyRevenue
    };
  },

  getMiningProductionStats(biz) {
    if (!biz) return { totalNickelTonPerHour: 0, totalGoldKgPerHour: 0, totalContractRevenue: 0, signedContractsCount: 0, totalHourlyRevenue: 0 };

    const facilities = biz.facilities || [];
    const contracts = biz.contracts || [];

    let totalNickelTonPerHour = 0;
    let totalGoldKgPerHour = 0;

    facilities.forEach(f => {
      const cat = typeof MINING_FACILITIES_CATALOG !== 'undefined' ? MINING_FACILITIES_CATALOG.find(x => x.id === f.id) : null;
      if (cat) {
        totalNickelTonPerHour += (cat.nickelTonPerHour || 0) * (f.count || 1);
        totalGoldKgPerHour += (cat.goldKgPerHour || 0) * (f.count || 1);
      }
    });

    let totalContractRevenue = 0;
    contracts.forEach(cId => {
      const c = typeof MINING_CONTRACTS_CATALOG !== 'undefined' ? MINING_CONTRACTS_CATALOG.find(x => x.id === cId) : null;
      if (c) {
        totalContractRevenue += c.hourlyRevenue || 0;
      }
    });

    const baseRevenue = 2500000000; // Rp 2,5 Miliar starter
    const totalHourlyRevenue = baseRevenue + totalContractRevenue;

    return {
      totalNickelTonPerHour,
      totalGoldKgPerHour,
      totalContractRevenue,
      signedContractsCount: contracts.length,
      totalHourlyRevenue
    };
  },

  getAirlineOperatingStats(biz) {
    if (!biz) return { grossRevenue: 0, totalMaintenanceCost: 0, netRevenue: 0, operatingPlanesCount: 0, groundedPlanesCount: 0, openRoutesCount: 0, operatingRoutesCount: 0, routeDetails: [] };

    const planes = biz.planes || [];
    const routes = biz.routes || [];
    const assignments = biz.planeAssignments || {};

    let totalMaintenanceCost = 0;
    let operatingPlanesCount = 0;
    let groundedPlanesCount = 0;

    planes.forEach(p => {
      const model = typeof AIRLINE_AIRCRAFT_CATALOG !== 'undefined' ? AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId) : null;
      if (model) {
        totalMaintenanceCost += model.maintenanceCost || 0;
      }
      if (p.isGrounded) {
        groundedPlanesCount++;
      } else {
        operatingPlanesCount++;
      }
    });

    let grossRevenue = 0;
    let operatingRoutesCount = 0;
    const routeDetails = [];
    const usedPlaneIds = new Set();

    routes.forEach(routeId => {
      const route = typeof AIRLINE_ROUTES_CATALOG !== 'undefined' ? AIRLINE_ROUTES_CATALOG.find(r => r.id === routeId) : null;
      if (!route) return;

      // Find assigned plane
      let assignedPlane = null;
      const explicitPlaneId = assignments[routeId];
      if (explicitPlaneId) {
        const found = planes.find(p => p.id === explicitPlaneId && !usedPlaneIds.has(p.id));
        if (found) {
          const model = typeof AIRLINE_AIRCRAFT_CATALOG !== 'undefined' ? AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === found.modelId) : null;
          if (model && model.category === route.requiredCategory) {
            assignedPlane = found;
          }
        }
      }

      // Auto-assign matching unassigned plane
      if (!assignedPlane) {
        assignedPlane = planes.find(p => {
          if (usedPlaneIds.has(p.id)) return false;
          const model = typeof AIRLINE_AIRCRAFT_CATALOG !== 'undefined' ? AIRLINE_AIRCRAFT_CATALOG.find(x => x.id === p.modelId) : null;
          return model && model.category === route.requiredCategory;
        }) || null;
      }

      let isOperating = false;
      let reason = 'no_plane';
      let rev = 0;

      if (assignedPlane) {
        usedPlaneIds.add(assignedPlane.id);
        if (assignedPlane.isGrounded) {
          reason = 'grounded';
          isOperating = false;
        } else {
          isOperating = true;
          reason = 'flying';
          rev = route.hourlyRevenue || 0;
          grossRevenue += rev;
          operatingRoutesCount++;
        }
      }

      routeDetails.push({
        route,
        plane: assignedPlane,
        isOperating,
        reason,
        revenue: rev
      });
    });

    const netRevenue = Math.max(0, grossRevenue - totalMaintenanceCost);

    return {
      totalPlanes: planes.length,
      operatingPlanesCount,
      groundedPlanesCount,
      openRoutesCount: routes.length,
      operatingRoutesCount,
      totalMaintenanceCost,
      grossRevenue,
      netRevenue: operatingRoutesCount > 0 ? netRevenue : 0,
      routeDetails
    };
  },

  getTechTotalEmployees(biz) {
    if (!biz || !biz.employees) return 0;
    return (biz.employees.dev || 0) + (biz.employees.lead || 0) + (biz.employees.designer || 0) + (biz.employees.tester || 0);
  },

  getTechHourlySalaries(biz) {
    if (!biz || !biz.employees) return 0;
    if (typeof TECH_ROLES === 'undefined') return 0;
    let total = 0;
    for (const [roleId, count] of Object.entries(biz.employees)) {
      const r = TECH_ROLES.find(x => x.id === roleId);
      if (r) total += (count || 0) * r.salary;
    }
    return total;
  },

  getSectorRevenueBreakdown() {
    let rawBiz = 0;
    if (Array.isArray(this.state.businesses)) {
      this.state.businesses.forEach(biz => {
        rawBiz += this.calculateSingleBusinessRevenue(biz);
      });
    }

    let rawStocks = 0;
    for (const [sym, st] of Object.entries(this.state.stocks)) {
      if (st.shares > 0 && this.stockPrices[sym]) {
        const stockDef = STOCKS_CATALOG.find(x => x.symbol === sym);
        if (stockDef && stockDef.dividendYieldHourly > 0) {
          const marketVal = st.shares * this.stockPrices[sym];
          rawStocks += Math.round(marketVal * stockDef.dividendYieldHourly);
        }
      }
    }

    let rawProp = 0;
    for (const [id, propVal] of Object.entries(this.state.properties)) {
      const prop = REAL_ESTATE_CATALOG.find(x => x.id === id);
      const count = typeof propVal === 'number' ? propVal : (propVal ? propVal.count : 0);
      if (prop && count > 0) {
        const isFurnished = typeof propVal === 'object' && propVal.furnished;
        const isInternet = typeof propVal === 'object' && propVal.internet;
        const condition = typeof propVal === 'object' && propVal.condition !== undefined ? propVal.condition : 100;

        let multiplier = 1.0;
        if (isFurnished) multiplier += 0.25;
        if (isInternet) multiplier += 0.15;
        const condMultiplier = Math.max(0.4, condition / 100);

        const grossRent = Math.round(prop.hourlyRent * multiplier * condMultiplier * count);
        const maintCost = Math.round((prop.hourlyMaintenance || (prop.hourlyRent * 0.12)) * count);
        rawProp += Math.max(0, grossRent - maintCost);
      }
    }

    return { rawBiz, rawStocks, rawProp };
  },

  calculateHourlyIncome() {
    const { rawBiz, rawStocks, rawProp } = this.getSectorRevenueBreakdown();
    const threshold = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.MANDATORY_THRESHOLD) || 25000000;
    const rate = (GAME_CONFIG.TAX_CONFIG && GAME_CONFIG.TAX_CONFIG.RATE) || 0.05;

    let total = 0;

    // 1. Sektor Bisnis
    if (this.state.taxes && this.state.taxes.business && this.state.taxes.business.suspended) {
      // Disuspend oleh KPP DJP -> Rp 0
    } else {
      if (rawBiz <= 0) {
        total += rawBiz; // Beban rutin (gaji karyawan dll) langsung memotong pendapatan
      } else if (rawBiz < threshold) {
        total += Math.round(rawBiz * (1 - rate)); // Dipotong pajak otomatis 5% (PPh Final UMKM)
      } else {
        total += rawBiz; // Wajib Lapor Mandiri: pemain menerima omzet dan membayar tagihan pajak mandiri
      }
    }

    // 2. Sektor Dividen Saham
    if (this.state.taxes && this.state.taxes.stocks && this.state.taxes.stocks.suspended) {
      // Disuspend oleh KPP DJP -> Rp 0
    } else {
      if (rawStocks < threshold) {
        total += Math.round(rawStocks * (1 - rate)); // Dipotong pajak otomatis 5%
      } else {
        total += rawStocks; // Wajib Lapor Mandiri
      }
    }

    // 3. Sektor Properti
    if (this.state.taxes && this.state.taxes.property && this.state.taxes.property.suspended) {
      // Disuspend oleh KPP DJP -> Rp 0
    } else {
      if (rawProp <= 0) {
        // 0
      } else if (rawProp < threshold) {
        total += Math.round(rawProp * (1 - rate)); // Dipotong pajak otomatis 5%
      } else {
        total += rawProp; // Wajib Lapor Mandiri
      }
    }

    return total;
  },

  calculateSingleBusinessRevenue(biz) {
    const sector = BUSINESS_SECTORS.find(s => s.sectorId === biz.sectorId);
    if (!sector) return 0;

    // 1. Toko & Supermarket
    if (biz.sectorId === 'retail') {
      const sub = sector.subtypes.find(st => st.id === biz.subTypeId) || sector.subtypes[0];
      return Math.round(sub.revenue * Math.pow(1.25, biz.level - 1));
    }

    // 2. Taksi & Ojol (Dihitung dari armada kendaraan aktif)
    if (sector.isFleet) {
      let fleetRev = 0;
      if (biz.vehicles) {
        biz.vehicles.forEach(v => {
          const cat = TAXI_FLEET_VEHICLES.find(x => x.id === v.modelId);
          if (cat && v.km < cat.maxKm) {
            fleetRev += cat.revenue;
          }
        });
      }
      return fleetRev;
    }

    // 3. Fashion Brand (Milestones / Stages Roadmap)
    if (biz.sectorId === 'fashion') {
      const sub = sector.subtypes.find(st => st.id === biz.subTypeId) || sector.subtypes[0];
      const stageIdx = Math.min(biz.level, FASHION_STAGES.length) - 1;
      const stage = FASHION_STAGES[stageIdx] || FASHION_STAGES[0];
      return Math.round(sub.revenue * stage.multiplier);
    }

    // 4. Ekspedisi & Pergudangan Logistik
    if (sector.isLogistics) {
      let rev = 0;
      // Truk aktif
      if (biz.trucks) {
        biz.trucks.forEach(t => {
          const cat = LOGISTICS_FLEET_VEHICLES.find(x => x.id === t.modelId);
          if (cat && t.km < cat.maxKm) {
            rev += cat.revenue;
          }
        });
      }
      // Sewa mitra gudang
      if (biz.tenants) {
        biz.tenants.forEach(tenId => {
          const tenant = LOGISTICS_TENANTS_CATALOG.find(x => x.id === tenId);
          if (tenant) rev += tenant.hourlyRent;
        });
      }
      return rev;
    }

    // 5. Bank Komersial
    if (sector.isBank) {
      return this.calculateBankProfit(biz);
    }

    // 6. Studio Game & Software House (Beban Rutin Gaji Karyawan)
    if (sector.isTech || biz.sectorId === 'tech') {
      return -this.getTechHourlySalaries(biz);
    }

    // 7. Maskapai Penerbangan Komersial (Rute Antarnegara & Armada Pesawat)
    if (sector.isAirline || biz.sectorId === 'airline') {
      const stats = this.getAirlineOperatingStats(biz);
      return stats.grossRevenue;
    }

    // 8. Perusahaan Minyak & Gas Bumi (Kontrak Penyaluran Migas)
    if (sector.isOil || biz.sectorId === 'oil') {
      return this.getOilProductionStats(biz).totalHourlyRevenue;
    }

    // 9. Korporasi Tambang Nikel & Emas (Kontrak Suplai Konsentrat Logam)
    if (sector.isMining || biz.sectorId === 'mining') {
      return this.getMiningProductionStats(biz).totalHourlyRevenue;
    }

    // 10. Bisnis Lainnya (Kafe, Space)
    return Math.round((sector.baseRevenue || 0) * Math.pow(1.35, biz.level - 1));
  },

  calculateBankProfit(bankState) {
    const vault = bankState.vault || 0;
    const depRate = bankState.depositRate || 5.0;
    const credRate = bankState.creditRate || 11.5;
    const customerDeposits = this.getBankCustomerDeposits(bankState);

    const creditDemand = Math.max(0.1, 1 - (credRate - 5) / 30);
    const lendableFunds = vault + (customerDeposits * 0.85);
    const customerCredits = lendableFunds * creditDemand * 0.95;

    const creditIncome = customerCredits * (credRate / 100) / 12;
    const depositExpense = customerDeposits * (depRate / 100) / 12;

    return Math.round(creditIncome - depositExpense);
  }
});
