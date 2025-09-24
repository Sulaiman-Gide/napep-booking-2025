import * as React from 'react';

declare module '../../components/PaymentBottomSheet' {
  interface PaymentBottomSheetMethods {
    expand: () => void;
    close: () => void;
  }

  interface PaymentBottomSheetProps {
    onSuccess: (amount: string) => void;
  }

  interface SuccessBottomSheetMethods {
    expand: () => void;
    close: () => void;
  }

  interface SuccessBottomSheetProps {
    onClose: () => void;
  }

  export const PaymentBottomSheet: React.ForwardRefExoticComponent<
    PaymentBottomSheetProps & React.RefAttributes<PaymentBottomSheetMethods>
  >;

  export const SuccessBottomSheet: React.ForwardRefExoticComponent<
    SuccessBottomSheetProps & React.RefAttributes<SuccessBottomSheetMethods>
  >;
}
