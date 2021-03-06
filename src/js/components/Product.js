import {select, classNames, templates} from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';

class Product{
  constructor(id, data){
    const thisProduct = this; //instacja klasy Product

    thisProduct.id = id; //zapisanie wartości argumentów do właściwości instancji
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    //console.log('new Product:', thisProduct);
  }

  renderInMenu(){
    const thisProduct = this;

    /* generate HTML based on template */
    const generatedHTML = templates.menuProduct(thisProduct.data);

    /* create element using utils.createDOMFromHTML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML); //stworzony element DOM zapisujemy od razu jako właściwość instancji

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements(){
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion(){
    const thisProduct = this;

    /* find the clickable trigger (the element that should react to clicking) */
    //const clickableTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);

    /* START: add event listener to clickable trigger on event click */
    thisProduct.accordionTrigger.addEventListener('click', function(event) {

      /* prevent default action for event */
      event.preventDefault();

      /* find active product (product that has active class) */
      const activeProduct = document.querySelector(select.all.menuProductsActive);

      /* if there is active product and it's not thisProduct.element, remove class active from it */
      if(activeProduct && activeProduct != thisProduct.element){
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }

      /* toggle active class on thisProduct.element */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
    });
  }

  initOrderForm(){
    const thisProduct = this;
    //console.log(thisProduct.initOrderForm);

    thisProduct.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

    for(let input of thisProduct.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

  processOrder(){
    const thisProduct = this;
    //console.log(thisProduct.processOrder);

    /* covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']} */
    const formData = utils.serializeFormToObject(thisProduct.form);
    //console.log('formData', formData);

    /* set price to default price */
    let price = thisProduct.data.price;

    /* for every category (param)... */
    for(let paramId in thisProduct.data.params) {

      /* determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... } */
      const param = thisProduct.data.params[paramId];
      //console.log(paramId, param);

      /* for every option in this category */
      for(let optionId in param.options) {

        /* determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true } */
        const option = param.options[optionId];
        //console.log(optionId, option);

        /* check if there is param with a name of paramId in formData and if it includes optionId */
        if(formData[paramId] && formData[paramId].includes(optionId)) {
          /* check if the option is not default */
          if(option.default !== true) {
            /* add option price to price variable */
            price = price + option.price;
          }
        } else {
          /* check if the option is default */
          if(option.default == true) {
            /* reduce price variable */
            price = price - option.price;
          }
        }

        /* find image with class .paramId-optionId in imageWrapper */
        const getImage = thisProduct.imageWrapper.querySelector('.' + paramId + '-' + optionId);

        /* check if there is an image for the option */
        if(getImage){

          /* check if option is selected */
          if(formData[paramId] && formData[paramId].includes(optionId)){
            /* if picked, add class classNames.menuProduct.imageVisible */
            getImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
            /* if not picked, remove class classNames.menuProduct.imageVisible */
            getImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }

    thisProduct.priceSingle = price;

    /* multiply price by amount */
    price *= thisProduct.amountWidget.value;

    /* update calculated price in the HTML*/
    thisProduct.priceElem.innerHTML = price;

  }

  initAmountWidget(){
    const thisProduct = this;

    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function(){
      thisProduct.processOrder();
    });
  }

  addToCart(){
    const thisProduct = this;

    //app.cart.add(thisProduct.prepareCartProduct());
    // tworzymy customowy event, żeby nie importować app do innego pliku

    const event = new CustomEvent('add-to-cart',{
      bubbles: true,
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }

  prepareCartProduct(){
    const thisProduct = this;

    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: thisProduct.prepareCartProductParams(),
    };

    return productSummary;
  }

  prepareCartProductParams(){
    const thisProduct = this;

    const cartProductparams = {};

    /* covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']} */
    const formData = utils.serializeFormToObject(thisProduct.form);

    /* for every category (param)... */
    for(let paramId in thisProduct.data.params) {

      /* determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... } */
      const param = thisProduct.data.params[paramId];

      cartProductparams[paramId] ={
        label: param.label,
        options: {},
      };

      /* for every option in this category */
      for(let optionId in param.options) {

        /* determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true } */
        const option = param.options[optionId];

        /* check if there is param with a name of paramId in formData and if it includes optionId */
        if(formData[paramId] && formData[paramId].includes(optionId)) {
          cartProductparams[paramId].options[optionId] = option.label;
        }
      }
    }

    return cartProductparams;
  }
}

export default Product;