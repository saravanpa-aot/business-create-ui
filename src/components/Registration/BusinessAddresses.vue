<template>
  <div id="business-addresses">
    <!-- Address Summary -->
    <template v-if="!isEditing">
      <v-row no-gutters id="address-summary">
        <v-col md="3" class="mr-n1"><label><strong>Business Addresses</strong></label></v-col>
        <v-col md="4">
          <label class="mailing-address-header"><strong>Mailing Address</strong></label>
          <MailingAddress
            v-if="!isEmptyAddress(mailingAddress)"
            :address="mailingAddress"
            :editing="false"
          />
          <div v-else>(Not entered)</div>
        </v-col>

        <v-col md="4">
          <label class="delivery-address-header"><strong>Delivery Address</strong></label>
          <DeliveryAddress
            v-if="!isEmptyAddress(deliveryAddress) && !inheritMailingAddress"
            :address="deliveryAddress"
            :editing="false"
          />
          <div v-else-if="isEmptyAddress(deliveryAddress)">(Not entered)</div>
          <div v-else>Same as Mailing Address</div>
        </v-col>
      </v-row>
    </template>

    <!-- Address Form -->
    <v-card flat v-else>
      <ul class="address-list address-form">
        <!-- Mailing Address -->
        <li class="address-list-container pa-5">
          <div class="meta-container">
            <label>Mailing Address</label>
            <div class="meta-container__inner">
              <MailingAddress
                id="address-mailing"
                ref="mailingAddress"
                :address="mailingAddress"
                :editing="true"
                :schema="RegistrationMailingAddressSchema"
                @update:address="updateAddress(MAILING_ADDRESS, $event)"
                @valid="updateAddressValid(MAILING_ADDRESS, $event)"
              />
            </div>
          </div>
        </li>

        <!-- Delivery Address -->
        <li class="address-list-container pa-5">
          <div class="meta-container">
            <label>Delivery Address</label>
            <div class="meta-container__inner">
              <div class="form__row">
                <v-checkbox
                  id="same-as-mailing-checkbox"
                  class="inherit-checkbox"
                  label="Same as Mailing Address"
                  v-model="inheritMailingAddress"
                  v-on:change="onCheckboxChanged()"
                  :disabled="checkboxDisabled"
                  noPoBox="true"
                />
              </div>
              <template
                v-if="!isSame(mailingAddress, deliveryAddress, ['actions']) || !inheritMailingAddress"
              >
                <DeliveryAddress
                  id="address-delivery"
                  ref="deliveryAddress"
                  v-if="!inheritMailingAddress"
                  :address="deliveryAddress"
                  :editing="true"
                  :schema="RegistrationDeliveryAddressSchema"
                  :noPoBox="true"
                  @update:address="updateAddress(DELIVERY_ADDRESS, $event)"
                  @valid="updateAddressValid(DELIVERY_ADDRESS, $event)"
                />
              </template>
            </div>
          </div>
        </li>
      </ul>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Mixins, Prop, Watch } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'
import { isEmpty, isEqual } from 'lodash'
import BaseAddress from 'sbc-common-components/src/components/BaseAddress.vue'
import { RegistrationMailingAddressSchema, RegistrationDeliveryAddressSchema } from '@/schemas'
import { CommonMixin, EntityFilterMixin } from '@/mixins'
import { ActionBindingIF, AddressIF, BusinessAddressIF, EmptyAddress, RegistrationStateIF } from '@/interfaces'

const REGION_BC = 'BC'
const COUNTRY_CA = 'CA'

// default address in BC, Canada
const DefaultAddress: AddressIF = {
  streetAddress: '',
  streetAddressAdditional: '',
  addressCity: '',
  addressRegion: REGION_BC,
  postalCode: '',
  addressCountry: COUNTRY_CA,
  deliveryInstructions: ''
}

@Component({
  components: {
    DeliveryAddress: BaseAddress,
    MailingAddress: BaseAddress
  }
})
export default class BusinessAddresses extends Mixins(CommonMixin, EntityFilterMixin) {
  // Refs for BaseAddress components so we can access form validation
  $refs!: {
    mailingAddress: any
    deliveryAddress: any
  }

  /**
   * Whether to show the editable forms for the addresses (true)
   * or just the static display addresses (false).
   */
  @Prop({ required: true })
  readonly isEditing!: boolean

  /** Whether to show errors (editing mode only). */
  @Prop({ required: true })
  readonly showErrors!: boolean

  @Getter getRegistration!: RegistrationStateIF

  @Action setRegistrationBusinessAddress!: ActionBindingIF

  // BaseAddress state variables
  // (Note that if the initial value is undefined, the class property will not be
  // reactive, which means the changes for the properties will not be detected.)
  private mailingAddress: AddressIF = null
  private deliveryAddress: AddressIF = null
  private mailingAddressValid = false
  private deliveryAddressValid = false

  // State of checkbox
  private inheritMailingAddress = false
  private checkboxDisabled = false

  // Misc for template
  readonly RegistrationMailingAddressSchema = RegistrationMailingAddressSchema
  readonly RegistrationDeliveryAddressSchema = RegistrationDeliveryAddressSchema
  readonly MAILING_ADDRESS = 'mailingAddress'
  readonly DELIVERY_ADDRESS = 'deliveryAddress'

  /** Whether the addresses form is valid. */
  get isFormValid (): boolean {
    return (this.mailingAddressValid && (this.deliveryAddressValid || this.inheritMailingAddress))
  }

  /** Returns true if the address object is empty or with only with default values. */
  isEmptyAddress (address: AddressIF): boolean {
    return (
      isEmpty(address) ||
      this.isSame(address, EmptyAddress) ||
      this.isSame(address, DefaultAddress)
    )
  }

  /** Called when component is created. */
  created (): void {
    // don't allow "same as" if mailing address is not in BC/Canada
    this.checkboxDisabled = (this.mailingAddress.addressRegion !== REGION_BC ||
      this.mailingAddress.addressCountry !== COUNTRY_CA)

    // on first load, init checkbox
    this.inheritMailingAddress = this.isSame(this.mailingAddress, this.deliveryAddress)
  }

  /** Called when the "same as" checkbox value has changed. */
  onCheckboxChanged (): void {
    if (this.inheritMailingAddress) {
      // clone mailing address into delivery address
      this.deliveryAddress = { ...this.mailingAddress }
    } else {
      // reset delivery address
      this.deliveryAddress = { ...DefaultAddress }
    }

    this.setRegistrationBusinessAddress({
      mailingAddress: this.mailingAddress,
      deliveryAddress: this.deliveryAddress
    })
  }

  /**
   * Updates the specified address' data.
   * @param addressToUpdate the address type to set the data of
   * @param address the new address data
   */
  updateAddress (addressToUpdate: string, address: AddressIF): void {
    switch (addressToUpdate) {
      case this.MAILING_ADDRESS:
        // avoid reactive looping
        if (isEqual(this.mailingAddress, address)) break

        // assign new address
        this.mailingAddress = address

        // don't allow "same as" if mailing address is not in BC/Canada
        this.checkboxDisabled = (this.mailingAddress.addressRegion !== REGION_BC ||
          this.mailingAddress.addressCountry !== COUNTRY_CA)

        if (this.inheritMailingAddress) {
          // if checkbox is now disabled, uncheck it
          if (this.checkboxDisabled) this.inheritMailingAddress = false
          // update the delivery address
          this.onCheckboxChanged()
        }

        break
      case this.DELIVERY_ADDRESS:
        // avoid reactive looping
        if (isEqual(this.deliveryAddress, address)) break

        // assign new address
        this.deliveryAddress = address

        break
    }

    this.setRegistrationBusinessAddress({
      mailingAddress: this.mailingAddress,
      deliveryAddress: this.deliveryAddress
    })
  }

  /**
   * Updates the specified address' validity.
   * @param addressToValidate the address type to set the validity of
   * @param valid whether the address is valid
   */
  updateAddressValid (addressToValidate: string, valid: boolean): void {
    switch (addressToValidate) {
      case this.MAILING_ADDRESS:
        this.mailingAddressValid = valid
        break
      case this.DELIVERY_ADDRESS:
        this.deliveryAddressValid = valid
        break
    }
    this.emitValid()
  }

  @Watch('isFormValid')
  private onIsFormValidChanged (): void {
    this.emitValid()
  }

  // NB: needs "immediate" to set initial filing data
  // NB: due to "immediate", this is called before created()
  @Watch('getRegistration.businessAddress', { immediate: true })
  private onBusinessAddressChanged (businessAddress: BusinessAddressIF): void {
    if (!businessAddress) {
      // initialize addresses
      this.mailingAddress = { ...EmptyAddress }
      this.deliveryAddress = { ...DefaultAddress }
    } else {
      // assign new addresses
      this.mailingAddress = businessAddress.mailingAddress
      this.deliveryAddress = businessAddress.deliveryAddress
    }
  }

  @Watch('showErrors')
  private onShowErrorsChanged (): void {
    // only show errors in editing mode
    if (this.showErrors && this.isEditing) {
      // validate mailing address
      this.$refs.mailingAddress.$refs.addressForm.validate()
      if (!this.inheritMailingAddress) {
        // validate delivery address
        this.$refs.deliveryAddress.$refs.addressForm.validate()
      }
    }
  }

  /** Emits the valid state of the address form. */
  @Emit('valid')
  private emitValid (): boolean {
    return this.isFormValid
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/theme.scss';

.meta-container {
  display: flex;
  flex-flow: column nowrap;
  position: relative;
}

label:first-child {
  font-weight: 700;
  &__inner {
    flex: 1 1 auto;
  }
}

.meta-container__inner {
  margin-top: 1rem;
}

@media (min-width: 768px) {
  .meta-container {
    flex-flow: row nowrap;

    label:first-child {
      flex: 0 0 auto;
      width: 12rem;
    }
  }

  .meta-container__inner {
    flex: 1 1 auto;
    margin-top: 0;
  }
}

.address-list .form {
  margin-top: 1rem;
}

@media (min-width: 768px) {
  .address-list .form {
    margin-top: 0rem;
  }
}

// Form Row Elements
.form__row + .form__row {
  margin-top: 0.25rem;
}

.form__row.three-column {
  display: flex;
  flex-flow: row nowrap;
  align-items: stretch;
  margin-right: -0.5rem;
  margin-left: -0.5rem;
}

.inherit-checkbox {
  margin-top: 0;
  margin-left: -3px;
  padding: 0;
}

.address-form {
  li:first-child {
    padding-bottom: 0;
  }
}

ul {
  margin: 0;
  padding: 0;
  list-style-type: none;
}

.address-edit-header {
  display: flex;
  background-color: rgba(1, 51, 102, 0.15);
  padding: 1.25rem;

  address-edit-title {
    font-size: $px-16;
    font-weight: bold;
    line-height: 1.375rem;
  }
}

label {
  color: $gray9;
}

.mailing-address-header,
.delivery-address-header {
  font-size: $px-14;
}

// make delivery address Province and Country unclickable
// NB: doesn't prevent keyboard input
// ::v-deep #address-delivery {
//   .v-input.address-region,
//   .v-input.address-country {
//     pointer-events: none;
//   }
// }

// italicize delivery instructions
::v-deep .base-address {
  .address-block__info-row:last-of-type {
    font-style: italic;
  }
}
</style>
