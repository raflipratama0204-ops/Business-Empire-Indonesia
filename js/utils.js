// Business Empire: RichMan - Utility & Formatting Module
Object.assign(GameEngine.prototype, {
  formatMoney(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    return sign + 'Rp ' + Math.floor(abs).toLocaleString('id-ID');
  },

  formatCompact(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1_000_000_000_000) {
      return sign + 'Rp ' + (abs / 1_000_000_000_000).toFixed(2).replace('.', ',') + ' T';
    }
    if (abs >= 1_000_000_000) {
      return sign + 'Rp ' + (abs / 1_000_000_000).toFixed(2).replace('.', ',') + ' M';
    }
    if (abs >= 1_000_000) {
      return sign + 'Rp ' + (abs / 1_000_000).toFixed(2).replace('.', ',') + ' Jt';
    }
    if (abs >= 1_000) {
      return sign + 'Rp ' + (abs / 1_000).toFixed(1).replace('.', ',') + ' Rb';
    }
    return sign + 'Rp ' + Math.floor(abs).toLocaleString('id-ID');
  },

  formatDuration(seconds) {
    if (seconds < 60) return `${seconds} dtk`;
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return rem > 0 ? `${mins} mnt ${rem} dtk` : `${mins} mnt`;
  },

  generateSparkline(history, color) {
    if (!history || history.length < 2) return '';
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 1;
    const width = 280;
    const height = 28;

    const points = history.map((val, idx) => {
      const x = (idx / (history.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
        <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
      </svg>
    `;
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }

    const existingToasts = container.querySelectorAll('.toast');
    existingToasts.forEach(oldToast => {
      oldToast.classList.remove('toast-enter');
      oldToast.classList.add('toast-exit');
      setTimeout(() => oldToast.remove(), 180);
    });

    const toast = document.createElement('div');
    toast.className = `toast toast-enter ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    this.toastTimer = setTimeout(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 200);
    }, 2000);
  }
});
