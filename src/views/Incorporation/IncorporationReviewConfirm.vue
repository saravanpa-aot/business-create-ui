<template>
  <div id="incorporation-review-confirm">
    <!-- Company Statement -->
    <section class="mt-10 company-statement" v-if="isTypeBcomp">
      <p v-if="getCompanyTitle">
        <span class="company-statement-label">{{ getCompanyTitle }}:</span>
        {{ getCompanyDescription }}
      </p>
    </section>

    <!-- Review and Confirm -->
    <section class="mt-10">
      <header>
        <h2>Review and Confirm</h2>
        <p class="mt-4 mb-6">
          Review the information in your application. If you need to change or complete anything, return
          to the step to make the necessary change.
          </p>
      </header>
      <Summary class="mt-6" />
    </section>

    <!-- Incorporation Date and Time -->
    <section v-if="isBaseCompany" class="mt-10">
      <header>
        <h2>Incorporation Date and Time</h2>
        <p class="mt-4 mb-6">
          Select the Date and Time of incorporation for your business. You may select
          a date up to 10 days in the future (note: there is an <strong>additional fee of $100</strong> to enter an
          incorporation date in the future). Unless a business has special requirements, most businesses select an
          immediate Date and Time of Incorporation.
        </p>
      </header>
      <IncorporationDateTime
        :effectiveDateTime="getEffectiveDateTime"
        @valid="setEffectiveDateTimeValid($event)"
        @effectiveDate="setEffectiveDate($event)"
        @isFutureEffective="setIsFutureEffective($event)"
      />
    </section>

    <!-- Document Delivery -->
    <section id="document-delivery-section" class="mt-10">
      <header>
        <h2>Document Delivery</h2>
        <p class="mt-4 mb-6">
          Copies of the incorporation documents will be sent to the email addresses listed below.
        </p>
      </header>
      <DocumentDelivery
        :registeredOfficeEmail="getBusinessContact.email"
        :completingPartyEmail="getUserEmail"
      />
    </section>

    <!-- Certify -->
    <section class="mt-10">
      <header>
        <h2>Certify</h2>
        <p class="mt-4 mb-6">
          Confirm the legal name of the person authorized to complete and submit this application.
        </p>
      </header>
      <Certify
        :class="{ 'invalid-section': isCertifyInvalid }"
        :currentDate="getCurrentDate"
        :certifiedBy="getCertifyState.certifiedBy"
        :entityDisplay="getCompletingPartyStatement.entityDisplay"
        :isCertified="getCertifyState.valid"
        :statements="getCompletingPartyStatement.certifyStatements"
        :message="getCompletingPartyStatement.certifyClause"
        :isStaff="isRoleStaff"
        :firstColumn="3"
        :secondColumn="9"
        :invalidSection="isCertifyInvalid"
        :disableEdit="!isRoleStaff && isTypeCoop"
        @update:certifiedBy="onCertifiedBy($event)"
        @update:isCertified="onIsCertified($event)"
      />
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Action, Getter } from 'vuex-class'
import {
  ActionBindingIF, BusinessContactIF, CertifyIF, CertifyStatementIF, EffectiveDateTimeIF
} from '@/interfaces'
import { Certify } from '@bcrs-shared-components/certify'
import DocumentDelivery from '@/components/common/DocumentDelivery.vue'
import IncorporationDateTime from '@/components/Incorporation/IncorporationDateTime.vue'
import Summary from '@/components/Incorporation/Summary.vue'

@Component({
  components: {
    Certify,
    DocumentDelivery,
    IncorporationDateTime,
    Summary
  }
})
export default class IncorporationReviewConfirm extends Vue {
  @Getter getBusinessContact!: BusinessContactIF
  @Getter getCertifyState!: CertifyIF
  @Getter getCompanyTitle!: string
  @Getter getCompanyDescription!: string
  @Getter getCompletingPartyStatement!: CertifyStatementIF
  @Getter getValidateSteps!: boolean
  @Getter isBaseCompany!: boolean
  @Getter isTypeBcomp!: boolean
  @Getter isTypeCoop!: boolean
  @Getter isRoleStaff!: boolean
  @Getter getCurrentDate!: string
  @Getter getEffectiveDateTime!: EffectiveDateTimeIF
  @Getter getUserEmail!: string

  @Action setEffectiveDateTimeValid!: ActionBindingIF
  @Action setEffectiveDate!: ActionBindingIF
  @Action setIsFutureEffective!: ActionBindingIF
  @Action setCertifyState!: ActionBindingIF

  /** Is true when the certify conditions are not met. */
  get isCertifyInvalid () {
    return this.getValidateSteps && (!this.getCertifyState.certifiedBy || !this.getCertifyState.valid)
  }

  /** Handler for Valid change event. */
  private onIsCertified (val: boolean): void {
    this.setCertifyState(
      {
        valid: val,
        certifiedBy: this.getCertifyState.certifiedBy
      }
    )
  }

  /** Handler for CertifiedBy change event. */
  private onCertifiedBy (val: string): void {
    this.setCertifyState(
      {
        valid: this.getCertifyState.valid,
        certifiedBy: val
      }
    )
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/theme.scss';

#incorporation-review-confirm {
  /* Set "header-counter" to 0 */
  counter-reset: header-counter;
}

h2::before {
  /* Increment "header-counter" by 1 */
  counter-increment: header-counter;
  content: counter(header-counter) '. ';
}

.company-statement-label {
  letter-spacing: -0.04rem;
  font-weight: 700;
}

::v-deep #document-delivery-section {
  .v-card {
    padding: 1.5rem 1.25rem !important;
  }

  .row {
    padding: 0.75rem 0;

    .col-3 {
      font-size: $px-14;
      color: $gray9;
      padding: 0 0 0 0.75rem !important;
    }

    .col-9 {
      padding: 0 0.5rem 0 0 !important;
    }
  }
}
</style>
