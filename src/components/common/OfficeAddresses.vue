<template>
  <div id="office-addresses">
    <!-- Address Summary -->
    <template v-if="!isEditing">
      <v-row no-gutters id="summary-registered-address">
        <v-col md="3" class="mr-n1"><label><strong>Registered Office</strong></label></v-col>
        <v-col md="4">
          <label class="mailing-address-header"><strong>Mailing Address</strong></label>
          <mailing-address
            v-if="!isEmptyAddress(mailingAddress)"
            :address="mailingAddress"
            :editing="false"
          />
          <div v-else>(Not entered)</div>
        </v-col>

        <v-col md="4">
          <label class="delivery-address-header"><strong>Delivery Address</strong></label>
          <delivery-address
            v-if="!isEmptyAddress(deliveryAddress) && !inheritMailingAddress"
            :address="deliveryAddress"
            :editing="false"
          />
          <div v-else-if="isEmptyAddress(deliveryAddress)">(Not entered)</div>
          <div v-else>Same as Mailing Address</div>
        </v-col>
      </v-row>

      <v-row no-gutters id="summary-records-address" v-if="!entityFilter(CorpTypeCd.COOP)" class="mt-4">
        <v-col md="3" class="mr-n1"><label><strong>Records Office</strong></label></v-col>
        <v-col md="4">
          <label class="mailing-address-header"><strong>Mailing Address</strong></label>
          <mailing-address
            v-if="!inheritRegisteredAddress && !isEmptyAddress(recMailingAddress)"
            :address="recMailingAddress"
            :editing="false"
          />
          <div v-else-if="isEmptyAddress(recMailingAddress)">(Not entered)</div>
          <div v-else>Same as Registered Office</div>
        </v-col>

        <v-col md="4">
          <label class="delivery-address-header"><strong>Delivery Address</strong></label>
          <delivery-address
            v-if="!inheritRecMailingAddress && !inheritRegisteredAddress && !isEmptyAddress(recDeliveryAddress)"
            :address="recDeliveryAddress"
            :editing="false"
          />
          <div v-else-if="isEmptyAddress(recDeliveryAddress)">(Not entered)</div>
          <div v-else-if="inheritRegisteredAddress">Same as Registered Office</div>
          <div v-else>Same as Mailing Address</div>
        </v-col>
      </v-row>
    </template>

    <!-- Address Form -->
    <v-card flat v-else>
      <ul class="address-list address-form">
        <!-- Registered Office -->
        <div class="address-edit-header">
          <label class="address-edit-title">Registered Office</label>
        </div>

        <!-- Registered Mailing Address -->
        <li class="address-list-container pa-5">
          <div class="meta-container">
            <label>Mailing Address</label>
            <div class="meta-container__inner">
              <MailingAddress ref="regMailingAddress"
                id="address-registered-mailing"
                :address="mailingAddress"
                :editing="true"
                :schema="OfficeAddressSchema"
                @update:address="updateAddress('mailingAddress', mailingAddress, $event)"
                @valid="updateAddressValid('mailingAddress', $event)"
              />
            </div>
          </div>
        </li>

        <!-- Registered Delivery Address -->
        <li class="address-list-container pa-5">
          <div class="meta-container">
            <label>Delivery Address</label>
            <div class="meta-container__inner">
              <div class="form__row">
                <v-checkbox
                  id="registered-mailing-same-chkbx"
                  class="inherit-checkbox"
                  label="Same as Mailing Address"
                  v-model="inheritMailingAddress"
                  v-on:change="setDeliveryAddressToMailingAddress()"
                />
              </div>
              <template
                v-if="!isSame(mailingAddress, deliveryAddress, ['actions']) || !inheritMailingAddress"
              >
                <DeliveryAddress ref="regDeliveryAddress"
                  id="address-registered-delivery"
                  v-if="!inheritMailingAddress"
                  :address="deliveryAddress"
                  :editing="true"
                  :schema="OfficeAddressSchema"
                  :noPoBox="true"
                  @update:address="updateAddress('deliveryAddress', deliveryAddress, $event)"
                  @valid="updateAddressValid('deliveryAddress', $event)"
                />
              </template>
            </div>
          </div>
        </li>

        <!--Records Office Address -->
        <template v-if="!entityFilter(CorpTypeCd.COOP)">
          <div class="address-edit-header">
            <label class="address-edit-title">Records Office</label>
            <v-checkbox
              id="records-mailing-same-chkbx"
              class="records-inherit-checkbox"
              label="Same as Registered Office"
              v-model="inheritRegisteredAddress"
              v-on:change="setRecordOfficeToRegisteredOffice()"
            />
          </div>

          <template v-if="!inheritRegisteredAddress">
            <!-- Records Mailing Address -->
            <li class="address-list-container pa-5">
              <div class="meta-container">
                <label>Mailing Address</label>
                <div class="meta-container__inner">
                  <MailingAddress ref="recMailingAddress"
                    id="address-records-mailing"
                    :address="recMailingAddress"
                    :editing="true"
                    :schema="OfficeAddressSchema"
                    @update:address="updateAddress('recMailingAddress', recMailingAddress, $event)"
                    @valid="updateAddressValid('recMailingAddress', $event)"
                  />
                </div>
              </div>
            </li>

            <!-- Records Delivery Address -->
            <li class="address-list-container pa-5">
              <div class="meta-container">
                <label>Delivery Address</label>
                <div class="meta-container__inner">
                  <div class="form__row">
                    <v-checkbox
                      class="inherit-checkbox"
                      label="Same as Mailing Address"
                      v-model="inheritRecMailingAddress"
                      v-on:change="setRecordDeliveryAddressToMailingAddress()"
                    />
                  </div>
                  <template
                    v-if="!isSame(recMailingAddress, recDeliveryAddress, ['actions']) || !inheritRecMailingAddress"
                  >
                    <DeliveryAddress ref="recDeliveryAddress"
                      id="address-records-delivery"
                      :address="recDeliveryAddress"
                      :editing="true"
                      :schema="OfficeAddressSchema"
                      :noPoBox="true"
                      @update:address="updateAddress('recDeliveryAddress', recDeliveryAddress, $event)"
                      @valid="updateAddressValid('recDeliveryAddress', $event)"
                    />
                  </template>
                </div>
              </div>
            </li>
          </template>
        </template>
      </ul>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Watch, Mixins } from 'vue-property-decorator'
import { Getter } from 'vuex-class'
import { isEmpty } from 'lodash'
import { OfficeAddressSchema } from '@/schemas'
import BaseAddress from 'sbc-common-components/src/components/BaseAddress.vue'
import { AddressIF, DefineCompanyIF, IncorporationAddressIF } from '@/interfaces'
import { CorpTypeCd } from '@/enums'
import { CommonMixin, EntityFilterMixin } from '@/mixins'

@Component({
  components: {
    DeliveryAddress: BaseAddress,
    MailingAddress: BaseAddress
  }
})
export default class OfficeAddresses extends Mixins(CommonMixin, EntityFilterMixin) {
  // Refs for sbc common base address components so we can access form validation
  $refs!: {
    regMailingAddress: any
    regDeliveryAddress: any
    recMailingAddress: any
    recDeliveryAddress: any
  }

  /**
   * Addresses object from the parent page.
   * If this is null then this is a new filing; otherwise these are the addresses from a draft/navigation
   * from other step.
   * This will be emitted back to the parent page when the addresses are updated.
   */
  @Prop({ default: null })
  readonly inputAddresses!: IncorporationAddressIF

  // Whether to show the editable forms for the addresses (true) or just the static display addresses (false).
  @Prop({ default: true })
  readonly isEditing!: boolean

  @Prop({ default: false })
  readonly showErrors!: boolean

  @Getter getDefineCompanyStep!: DefineCompanyIF

  // Local properties
  private addresses: IncorporationAddressIF = this.inputAddresses
  private defaultAddress: AddressIF = {
    addressCity: '',
    addressCountry: 'CA',
    addressRegion: 'BC',
    deliveryInstructions: '',
    postalCode: '',
    streetAddress: '',
    streetAddressAdditional: ''
  }

  // The 4 addresses that are the current state of the BaseAddress components:
  private mailingAddress = {} as AddressIF
  private deliveryAddress = {} as AddressIF
  private recMailingAddress = {} as AddressIF
  private recDeliveryAddress = {} as AddressIF

  // Validation events from BaseAddress:
  private mailingAddressValid: boolean = true
  private deliveryAddressValid: boolean = true
  private recMailingAddressValid: boolean = true
  private recDeliveryAddressValid: boolean = true

  private inheritMailingAddress: boolean = true

  // State of the checkbox for determining whether or not the mailing address is the same as the delivery address
  // For Records Office
  private inheritRecMailingAddress: boolean = true

  // State of the checkbox for determining whether the Record address is the same as the Registered address
  private inheritRegisteredAddress: boolean = true

  // Office Address schema for template
  readonly OfficeAddressSchema = OfficeAddressSchema

  // Enum for template
  readonly CorpTypeCd = CorpTypeCd

  /** Called when component is created. */
  created (): void {
    // on first load, determine inherited flags based on address values and update parent
    this.setAddresses(true)
    this.emitValid()
  }

  /**
   * Sets address data.
   * @param loadInheritedFlags used to update inherited flags based on isSame checks if true
   */
  private setAddresses (loadInheritedFlags: boolean): void {
    if (this.addresses.registeredOffice) {
      this.mailingAddress = this.addresses.registeredOffice.mailingAddress
      this.deliveryAddress = this.addresses.registeredOffice.deliveryAddress

      const isNew = this.isEmptyAddress(this.addresses.registeredOffice.mailingAddress) &&
              this.isEmptyAddress(this.addresses.registeredOffice.deliveryAddress)

      if (loadInheritedFlags) {
        if (this.showDeliveryAddressByDefault) {
          this.inheritMailingAddress = !(isNew) &&
            this.isSame(
              this.addresses.registeredOffice.mailingAddress,
              this.addresses.registeredOffice.deliveryAddress
            )
          // if it is a newly created IA, the delivery address should not be sychronized with mailing address
          if (!this.inheritMailingAddress && isNew) {
            this.deliveryAddress = this.defaultAddress
          }
        } else {
          this.inheritMailingAddress = this.isSame(
            this.addresses.registeredOffice.mailingAddress,
            this.addresses.registeredOffice.deliveryAddress
          )
        }
      }

      if (this.entityFilter(CorpTypeCd.BENEFIT_COMPANY)) {
        this.recMailingAddress = this.addresses.recordsOffice?.mailingAddress
        this.recDeliveryAddress = this.addresses.recordsOffice?.deliveryAddress

        if (loadInheritedFlags) {
          this.inheritRegisteredAddress = (
            this.isSame(
              this.addresses.registeredOffice.deliveryAddress,
              this.addresses.recordsOffice?.deliveryAddress
            ) &&
            this.isSame(
              this.addresses.registeredOffice.mailingAddress,
              this.addresses.recordsOffice?.mailingAddress
            )
          )

          this.inheritRecMailingAddress = this.isSame(
            this.addresses.recordsOffice?.mailingAddress,
            this.addresses.recordsOffice?.deliveryAddress
          )
        }
      }
    }
  }

  // Getters (Computed Values)
  /** Whether the address form is valid. */
  private get formValid (): boolean {
    const registeredOfficeValid = this.mailingAddressValid &&
      (this.deliveryAddressValid || this.inheritMailingAddress)

    const recordsOfficeValid = this.inheritRegisteredAddress ||
      (this.recMailingAddressValid && (this.inheritRecMailingAddress || this.recDeliveryAddressValid))

    return registeredOfficeValid && recordsOfficeValid
  }

  /** Whether the address object is empty or with only with default input values */
  private isEmptyAddress (address: AddressIF): boolean {
    return isEmpty(address) ||
           (!address.addressCity &&
           (!address.addressCountry || address.addressCountry === 'CA') &&
           (!address.addressRegion || address.addressRegion === 'BC') &&
           !address.deliveryInstructions &&
           !address.postalCode &&
           !address.streetAddress &&
           !address.streetAddressAdditional)
  }

  /* coop and corp display delivery address by default */
  private get showDeliveryAddressByDefault (): boolean {
    return [
      CorpTypeCd.COOP,
      CorpTypeCd.BENEFIT_COMPANY,
      CorpTypeCd.BC_CCC,
      CorpTypeCd.BC_COMPANY,
      CorpTypeCd.BC_ULC_COMPANY
    ].includes(this.getEntityType)
  }

  // Event Handlers
  /** Sets the Registered Delivery Address to the Registered Mailing Address. */
  private setDeliveryAddressToMailingAddress (): void {
    if (this.inheritMailingAddress) {
      this.deliveryAddress = { ...this.mailingAddress }
    } else {
      // Clear to default
      this.deliveryAddress = { ...this.defaultAddress }
    }

    // Records delivery address also needs to be updated if inherited
    if (this.inheritRegisteredAddress) {
      this.recDeliveryAddress = { ...this.deliveryAddress }
    }

    this.emitAddresses()
  }

  /** Sets the Records office addresses to the Registered office addresses. */
  private setRecordOfficeToRegisteredOffice (): void {
    if (this.inheritRegisteredAddress) {
      this.recDeliveryAddress = { ...this.deliveryAddress }
      this.recMailingAddress = { ...this.mailingAddress }
    } else {
      this.inheritRecMailingAddress = this.inheritMailingAddress
      // Clear to defaults
      this.recMailingAddress = { ...this.defaultAddress }
      this.recDeliveryAddress = { ...this.defaultAddress }
    }
    this.emitAddresses()
  }

  /** Sets the Records Delivery Address to Records Mailing Address. */
  private setRecordDeliveryAddressToMailingAddress (): void {
    if (this.inheritRecMailingAddress) {
      this.recDeliveryAddress = { ...this.recMailingAddress }
    } else {
      // Clear to default
      this.recDeliveryAddress = { ...this.defaultAddress }
    }
    this.emitAddresses()
  }

  /**
   * Updates the specified address' data.
   * @param addressToUpdate the address type to set the data of
   * @param baseAddress the address object to update
   * @param newAddress the new address data
   */
  private updateAddress (addressToUpdate: string, baseAddress: AddressIF, newAddress: AddressIF): void {
    Object.assign(baseAddress, newAddress)
    switch (addressToUpdate) {
      case 'mailingAddress':
        if (this.inheritMailingAddress) {
          this.deliveryAddress = { ...newAddress }
        }
        if (this.inheritRegisteredAddress) {
          this.recMailingAddress = { ...newAddress }
          this.recDeliveryAddress = { ...this.deliveryAddress }
        }
        break
      case 'deliveryAddress':
        if (this.inheritRegisteredAddress) {
          this.recDeliveryAddress = { ...newAddress }
        }
        break
      case 'recMailingAddress':
        if (this.inheritRecMailingAddress) {
          this.recDeliveryAddress = { ...newAddress }
        }
        break
      case 'recDeliveryAddress':
        // nothing to do
        break
      default:
        // eslint-disable-next-line no-console
        console.log(`Error: cannot update ${addressToUpdate}`)
    }
    this.emitAddresses()
  }

  /**
   * Updates the specified address' validity.
   * @param addressToValidate the address type to set the validity of
   * @param valid whether the address is valid
   */
  private updateAddressValid (addressToValidate: string, valid: boolean): void {
    switch (addressToValidate) {
      case 'deliveryAddress':
        this.deliveryAddressValid = valid
        break
      case 'mailingAddress':
        this.mailingAddressValid = valid
        break
      case 'recDeliveryAddress':
        this.recDeliveryAddressValid = valid
        break
      case 'recMailingAddress':
        this.recMailingAddressValid = valid
        break
      default:
        // eslint-disable-next-line no-console
        console.log(`Error: cannot validate ${addressToValidate}`)
    }
    this.emitValid()
  }

  // Watchers
  @Watch('formValid')
  private onFormValidityChange (val: boolean): void {
    this.emitValid()
  }

  @Watch('getDefineCompanyStep.officeAddresses', { deep: true, immediate: true })
  private updateAddresses (): void {
    this.addresses = this.inputAddresses
    this.setAddresses(false)
    this.emitValid()
  }

  // Watchers
  @Watch('showErrors')
  private onShowErrorsChanged (): void {
    // Check if addresses are valid
    if (this.showErrors && this.isEditing) {
      // Registered Mailing Address
      this.$refs.regMailingAddress.$refs.addressForm.validate()
      if (!this.inheritMailingAddress) {
        // Registered Delivery Address
        this.$refs.regDeliveryAddress.$refs.addressForm.validate()
      }

      if (!this.entityFilter(CorpTypeCd.COOP) && !this.inheritRegisteredAddress) {
        // Records Mailing Address
        this.$refs.recMailingAddress.$refs.addressForm.validate()
        if (!this.inheritRecMailingAddress) {
          // Records Delivery Address
          this.$refs.recDeliveryAddress.$refs.addressForm.validate()
        }
      }
    }
  }

  // Event Emitters
  /** Emits the valid state of this address form. */
  @Emit('valid')
  private emitValid (): boolean {
    return this.formValid
  }

  /** Emits updated addresses object to the parent page. */
  @Emit('update:addresses')
  private emitAddresses (): any {
    if (!this.entityFilter(CorpTypeCd.COOP)) {
      return {
        registeredOffice: {
          deliveryAddress: this.deliveryAddress,
          mailingAddress: this.mailingAddress
        },
        recordsOffice: {
          deliveryAddress: this.recDeliveryAddress,
          mailingAddress: this.recMailingAddress
        }
      }
    } else {
      return {
        registeredOffice: {
          deliveryAddress: this.deliveryAddress,
          mailingAddress: this.mailingAddress
        }
      }
    }
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

.records-inherit-checkbox {
  margin-top: 0;
  margin-left: 4.5rem;
  margin-bottom: -1.5rem;
  padding: 0;

  .v-messages {
    display: none !important;
  }
}

// Registered Office Address Form Behavior
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

// Editing Address Form
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
</style>
