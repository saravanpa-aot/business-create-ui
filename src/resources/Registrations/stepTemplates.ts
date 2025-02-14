import { RouteNames, ViewComponentNames } from '@/enums'

/**
 * The Registration step template.
 * Currently used for both Sole Props and General Partnerships.
 */
export const RegistrationSteps = [
  {
    id: 'step-1-btn',
    step: 1,
    icon: 'mdi-domain',
    text: 'Define Your \nBusiness',
    to: RouteNames.REGISTRATION_DEFINE_BUSINESS,
    component: ViewComponentNames.REGISTRATION_DEFINE_BUSINESS
  },
  {
    id: 'step-2-btn',
    step: 2,
    icon: 'mdi-handshake',
    text: 'Add People \nand Roles',
    to: RouteNames.REGISTRATION_PEOPLE_ROLES,
    component: ViewComponentNames.REGISTRATION_PEOPLE_ROLES

  },
  {
    id: 'step-3-btn',
    step: 3,
    icon: 'mdi-text-box-check-outline',
    text: 'Review\nand Confirm',
    to: RouteNames.REGISTRATION_REVIEW_CONFIRM,
    component: ViewComponentNames.REGISTRATION_REVIEW_CONFIRM
  }
]
