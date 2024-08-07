'use client'

import { useState, useEffect } from 'react';
import { Box, Stack, Typography, Button, Modal, TextField, CircularProgress, Alert, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { firestore } from '@/firebase';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

function InventoryModal({ open, handleClose, addItem, itemName, itemQuantity, setItemName, setItemQuantity }) {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Add Item
        </Typography>
        <Stack width="100%" direction="column" spacing={2}>
          <TextField
            id="item-name"
            label="Item"
            variant="outlined"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
            id="item-quantity"
            label="Quantity"
            type="number"
            variant="outlined"
            fullWidth
            value={itemQuantity}
            onChange={(e) => setItemQuantity(e.target.value)}
          />
          <Button
            variant="outlined"
            onClick={() => {
              if (itemName.trim() && itemQuantity > 0) {
                addItem(itemName, itemQuantity);
                setItemName('');
                setItemQuantity('');
                handleClose();
              }
            }}
          >
            Add
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}


function ConfirmDialog({ open, handleClose, handleConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>Confirm Removal</DialogTitle>
      <DialogContent>
        Are you sure you want to remove this item?
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} color="error">Remove</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Home() {
  const [itemQuantity, setItemQuantity] = useState('');
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState('');

  const updateInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const snapshot = query(collection(firestore, 'inventory'));
      const docs = await getDocs(snapshot);
      const inventoryList = [];
      docs.forEach((doc) => {
        inventoryList.push({ name: doc.id, ...doc.data() });
      });
      inventoryList.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
      setInventory(inventoryList);
    } catch (err) {
      setError('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity > 1) {
        await setDoc(docRef, { quantity: quantity - 1 });
      } else {
        await deleteDoc(docRef);
      }
    }
    await updateInventory();
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const openConfirmDialog = (item) => {
    setItemToRemove(item);
    setConfirmDialogOpen(true);
  };
  const closeConfirmDialog = () => setConfirmDialogOpen(false);
  const handleConfirmRemove = () => {
    removeItem(itemToRemove);
    setItemToRemove('');
    closeConfirmDialog();
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Typography textAlign="center" color="#FFC0CB" variant="h2" sx={{ fontFamily: 'serif', fontSize: '70px', fontWeight: 'bold' }}>
        My lovely pantry
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
      <InventoryModal
        open={open}
        handleClose={handleClose}
        addItem={addItem}
        itemName={itemName}
        itemQuantity={itemQuantity}
        setItemName={setItemName}
        setItemQuantity={setItemQuantity}
      />

          <Button variant="contained" onClick={handleOpen}>
            Add New Item
          </Button>
          <Box border="1px solid #" width="800px">
            <Box
              width="100%"
              height="100px"
              bgcolor="#ffb6c1"
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Typography
                variant="h2"
                color="#333"
                textAlign="center"
                sx={{ fontFamily: 'serif', fontSize: '36px', fontWeight: 'bold' }}
              >
                Things To Buy
              </Typography>
            </Box>
            <Stack width="100%" height="900px" spacing={2} sx={{ overflow: 'auto' }}>
              {inventory.map(({ name, quantity }) => (
                <Box
                  key={name}
                  width="100%"
                  minHeight="150px"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  bgcolor="#f0f0f0"
                  px={5}
                >
                  <Typography variant="h3" color="#333" textAlign="center">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="h3" color="#333" textAlign="center">
                    Quantity: {quantity}
                  </Typography>
                  <Button variant="contained" onClick={() => openConfirmDialog(name)}>
                    Remove
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
          <ConfirmDialog
            open={confirmDialogOpen}
            handleClose={closeConfirmDialog}
            handleConfirm={handleConfirmRemove}
          />
        </>
      )}
    </Box>
  );
}
