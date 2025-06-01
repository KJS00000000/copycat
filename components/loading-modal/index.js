(function() {
  class LoadingModal {
  
    static element;

    static {
      this.element = document.createElement('div');
      this.element.id = 'loading-modal';
      this.element.innerHTML = `
        <div class='background'></div>
        <div class='foreground'>
          Busy
        </div>
      `;
      document.body.appendChild(this.element);
      this.foregroundElement = this.element.getElementsByClassName('foreground')[0];
    }

    static hide() {
      this.element.style.display = 'none';
      this.element.style.visibility = 'hidden';
    }

    static show() {
      this.element.style.display = 'block';
      this.element.style.visibility = 'visible';
    }

    static updateForeground(options) {
      let html = options.html || 'Loading';
      if (options.append === true) {
        this.foregroundElement.innerHTML += '<br/>' + html;
      } else {
        this.foregroundElement.innerHTML = html;
      }
    }
  }

  window.LoadingModal = LoadingModal;
})();
