import $ from 'jquery';
import app from '../../../app';
import '../../../lib/select2';
import { getCurrenciesSortedByCode } from '../../../data/currencies';
import { openSimpleMessage } from '../../modals/SimpleMessage';
import Spend, { spend } from '../../../models/wallet/Spend';
import loadTemplate from '../../../utils/loadTemplate';
import baseVw from '../../baseVw';

export default class extends baseVw {
  constructor(options = {}) {
    super(options);
    this.saveInProgress = false;
    this.model = new Spend();
  }

  className() {
    return 'sendMoney';
  }

  events() {
    return {
      'click .js-btnSend': 'onClickSend',
      'click .js-sendMoneyClear': 'onClickClear',
    };
  }

  onClickSend(e) {
    const formData = this.getFormData(this.$formFields);
    this.model.set(formData);
    const save = spend(this.model.toJSON());
    this.model.validationError = save.error || null;

    // render so errors are shown / cleared
    this.render();

    if (save.jqXhr) {
      // POSTing payment to the server
      $(e.target).addClass('processing');
      this.saveInProgress = true;

      save
        .jqXhr
        .done(() => {
          // temporary alert until transaction is implemented
          // alert('Payment has been sent.');
        })
        .fail(jqXhr => {
          openSimpleMessage(app.polyglot.t('wallet.sendMoney.sendPaymentFailDialogTitle'),
            jqXhr.responseJSON && jqXhr.responseJSON.reason || '');
        })
        .always(() => {
          $(e.target).removeClass('processing');
          this.saveInProgress = false;
        });
    }

    const $firstErr = this.$('.errorList:first');
    if ($firstErr.length) $firstErr[0].scrollIntoViewIfNeeded();
  }

  onClickClear() {
    // this.model.clear();

    // for some reason model.clear is not working, so we'll go
    // with a manual approach
    this.model.unset('address');
    this.model.unset('amount');
    this.model.unset('memo');
    this.model.unset('currency');
    this.model.set(this.model.defaults || {});
    this.model.validationError = null;

    this.render();
  }

  focusAddress() {
    this.$addressInput.focus();
  }

  get $addressInput() {
    return this._$addressInput ||
      (this._$addressInput = this.$('#walletSendTo'));
  }

  get $formFields() {
    return this._$formFields ||
      (this._$formFields = this.$(`select[name], input[name], 
        textarea[name]:not([class*="trumbowyg"]), 
        div[contenteditable][name]`));
  }

  setFormData(data = {}, focusAddressInput = true) {
    this.model.set(data);
    this.render();
    if (focusAddressInput) this.focusAddressInput();
  }

  render() {
    loadTemplate('modals/wallet/sendMoney.html', (t) => {
      this.$el.html(t({
        ...this.model.toJSON(),
        errors: this.model.validationError || {},
        currency: this.model.get('currency') || app.settings.get('localCurrency'),
        currencies: this.currencies ||
          getCurrenciesSortedByCode(),
      }));

      this._$addressInput = null;
      this._$formFields = null;

      this.$('#walletSendCurrency').select2();
    });

    return this;
  }
}
