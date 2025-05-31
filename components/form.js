class Form {

  constructor(data) {
    let self = this;
    self.data = data;
    self.element = document.createElement('div');
    self.element.className = 'form';
    self.element.onclick = function() {
      self.isSelected = !self.isSelected;
      self.render();
    };
    self.isSelected = false;
    self.render();
  }

  render() {
    let self = this;
    self.element.innerHTML = `
      <div class='checkbox'>${(self.isSelected ? '&check;' : '')}</div>
      <div class='content'>${self.data.id} - ${self.data.name}</div>
    `;
  }

}