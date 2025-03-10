import React from 'react';
import { useSnackbar } from 'notistack';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import CreateAccountForm from './CreateAccountForm';

const CreateAccount = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const defaultAccountType = location.state?.defaultAccountType || "";

  const handleSave = () => {
    navigate('/accounts'); // Redirect after save
  };

  return (
    <MainLayout>
      <CreateAccountForm
        defaultAccountType={defaultAccountType}
        onSave={handleSave}
        enqueueSnackbar={enqueueSnackbar}
      />
    </MainLayout>
  );
};

export default CreateAccount;