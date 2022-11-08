import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Button, Text, InputField, AmountCard } from '@taraxa_project/taraxa-ui';
import SuccessIcon from '../../../assets/icons/success';

import useDelegation from '../../../services/useDelegation';

import { weiToEth } from '../../../utils/eth';
import { Validator } from '../../../interfaces/Validator';

type DelegateProps = {
  balance: ethers.BigNumber;
  validator: Validator;
  onSuccess: () => void;
  onFinish: () => void;
};

const Delegate = ({ balance, validator, onSuccess, onFinish }: DelegateProps) => {
  const { delegate } = useDelegation();

  let maximumDelegatable = ethers.BigNumber.from('0');
  if (validator.availableForDelegation.gt(balance)) {
    maximumDelegatable = balance;
  } else {
    maximumDelegatable = validator.availableForDelegation;
  }

  const [step, setStep] = useState(1);
  const [delegationTotal, setDelegationTotal] = useState(maximumDelegatable);
  const [error, setError] = useState('');

  const submit = async (
    event: React.MouseEvent<HTMLElement> | React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    // const delegationNumber = parseInt(delegationTotal, 10);
    // if (Number.isNaN(delegationNumber) || delegationNumber < 1000) {
    //   setError('must be a number greater than 1,000');
    //   return;
    // }

    // if (delegationNumber > availableStakingBalance) {
    //   setError('cannot exceed TARA available for delegation');
    //   return;
    // }
    // if (delegationNumber > availableStakingBalance) {
    //   setError("cannot exceed validator's ability to receive delegation");
    //   return;
    // }

    setError('');

    try {
      await delegate(validator.address, delegationTotal);
      onSuccess();
      setStep(2);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  return (
    <div className="delegateNodeModal">
      {step === 1 ? (
        <>
          <Text
            style={{ marginBottom: '32px', fontSize: '18px' }}
            align="center"
            label="Delegate to..."
            variant="h6"
            color="primary"
          />
          <div className="nodeDescriptor">
            <p className="nodeAddressWrapper">
              <span className="nodeAddress">{validator.address}</span>
            </p>
          </div>
          <div className="taraContainerWrapper">
            <div className="taraContainer taraContainerBalance">
              <p className="taraContainerAmountDescription">My available TARA for delegation</p>
              <AmountCard amount={ethers.utils.commify(weiToEth(balance))} unit="TARA" />
            </div>
            <div className="taraContainer">
              <p className="taraContainerAmountDescription">
                Validator’s availability to receive delegation
              </p>
              <AmountCard
                amount={ethers.utils.commify(weiToEth(validator.availableForDelegation))}
                unit="TARA"
              />
            </div>
          </div>
          <div className="taraInputWrapper">
            <p className="maxDelegatableDescription">Maximum delegate-able</p>
            <p className="maxDelegatableTotal">
              {ethers.utils.commify(weiToEth(maximumDelegatable))}
            </p>
            <p className="maxDelegatableUnit">TARA</p>
            <InputField
              error={!!error}
              helperText={error}
              label="Enter amount..."
              value={parseInt(weiToEth(delegationTotal), 10)}
              variant="outlined"
              type="text"
              fullWidth
              margin="normal"
              onChange={(event) => {
                setDelegationTotal(
                  ethers.BigNumber.from(event.target.value).mul(
                    ethers.BigNumber.from('10').pow(18),
                  ),
                );
              }}
            />
            <div className="delegatePercentWrapper">
              <Button
                size="small"
                className="delegatePercent"
                label="25%"
                variant="contained"
                onClick={() => {
                  setDelegationTotal(maximumDelegatable.mul(25).div(100));
                }}
              />
              <Button
                size="small"
                className="delegatePercent"
                label="50%"
                variant="contained"
                onClick={() => {
                  setDelegationTotal(maximumDelegatable.mul(50).div(100));
                }}
              />
              <Button
                size="small"
                className="delegatePercent"
                label="75%"
                variant="contained"
                onClick={() => {
                  setDelegationTotal(maximumDelegatable.mul(75).div(100));
                }}
              />
              <Button
                size="small"
                className="delegatePercent"
                label="100%"
                variant="contained"
                onClick={() => {
                  setDelegationTotal(maximumDelegatable);
                }}
              />
            </div>
            <Button
              type="submit"
              label="Delegate"
              color="secondary"
              variant="contained"
              className="marginButton"
              fullWidth
              onClick={submit}
            />
          </div>
        </>
      ) : (
        <>
          <Text style={{ marginBottom: '2%' }} label="Success" variant="h6" color="primary" />
          <div className="successIcon">
            <SuccessIcon />
          </div>
          <p className="successText">You've successfully delegated to a validator:</p>
          <div className="nodeDescriptor nodeDescriptorSuccess">
            <p className="nodeAddressWrapper">
              <span className="nodeAddress">{validator.address}</span>
            </p>
          </div>
          <Button
            type="submit"
            label="Ok"
            fullWidth
            color="secondary"
            variant="contained"
            className="marginButton"
            onClick={() => {
              onFinish();
            }}
          />
        </>
      )}
    </div>
  );
};

export default Delegate;
