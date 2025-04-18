import {
  BlockAuth,
  createAction,
  Property,
  Validators,
} from '@openops/blocks-framework';

export const division = createAction({
  name: 'division_math',
  auth: BlockAuth.None(),
  displayName: 'Division',
  description: 'Divide first number by the second number',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    first_number: Property.Number({
      displayName: 'First Number',
      description: undefined,
      required: true,
    }),
    second_number: Property.Number({
      displayName: 'Second Number',
      description: undefined,
      required: true,
      validators: [Validators.nonZero],
    }),
  },
  async run(context) {
    return (
      context.propsValue['first_number'] / context.propsValue['second_number']
    );
  },
});
