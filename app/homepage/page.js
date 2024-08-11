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
          Add Items
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
        My pantry
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
            Add New Items
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

"use client";

import { useState, useEffect } from "react";
import { firestore, auth } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import {
  Box,
  CssBaseline,
  Container,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Button,
  Typography,
} from "@mui/material";
import { Edit, Delete, Add as AddIcon } from "@mui/icons-material";
import {
  query,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { InView } from "react-intersection-observer";
import AppBar from "@/app/components/AppBar";
import InventoryStats from "@/app/components/InventoryStats";

const categories = [
  "Beverages",
  "Dairy Products",
  "Fruits",
  "Vegetables",
  "Meat and Poultry",
  "Seafood",
  "Bakery Products",
  "Grains and Cereals",
  "Snacks",
  "Condiments and Sauces",
  "Others",
];

const units = [
  "Kilogram (kg)",
  "Gram (g)",
  "Pound (lb)",
  "Liter (L)",
  "Milliliter (mL)",
  "Each (ea)",
  "Pack",
];

const labelStyle = { color: "#c6ddf0" };

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!user && !sessionStorage.getItem("user")) {
      router.push("/");
    }
  }, [user, router]);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, "products"));
    const docs = await getDocs(snapshot);
    const inventoryList = docs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setInventory(inventoryList);
  };

  const addProductToInventory = async (product) => {
    try {
      const docRef = await addDoc(collection(firestore, "products"), product);
      return { ...product, id: docRef.id };
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  const handleAddProduct = async (product) => {
    const newProduct = await addProductToInventory(product);
    if (newProduct) {
      setInventory((prev) => [...prev, newProduct]);
    }
    handleAddProductClose();
  };

  const removeItem = async (id) => {
    await deleteDoc(doc(firestore, "products", id));
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddProductOpen = () => setAddProductOpen(true);

  const handleAddProductClose = () => {
    setAddProductOpen(false);
    setCurrentProduct(null);
  };

  const handleEditProduct = async (product) => {
    try {
      await setDoc(doc(firestore, "products", product.id), product);
      setInventory((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
    } catch (error) {
      console.error("Error updating product: ", error);
    }
    handleAddProductClose();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const theme = createTheme({
    palette: {
      mode: "dark",
      background: {
        paper: "#5e4955",
        default: "#2a2b2a",
      },
      text: {
        primary: "#c6ddf0",
        secondary: "#c99da3",
      },
      primary: {
        main: "#996888",
      },
      secondary: {
        main: "#c99da3",
      },
    },
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.75 },
    visible: { opacity: 1, scale: 1 },
  };

  const tableRowVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar />
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{
          minHeight: "100vh",
          backgroundColor: "#232523",
          paddingTop: "64px",
        }}
      >
        <Box
          component={motion.div}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }} // Adjust the duration as needed
          sx={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: "40px",
            backgroundImage:
                    "linear-gradient(169deg, #2a2b2a 0%, #51404a 30%, #51404a 56%, #9a6581 100%)",
            border: "2px solid transparent",
            backgroundClip: "padding-box, border-box",
            backgroundOrigin: "border-box",
            position: "relative",
            zIndex: 1,
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "inherit",
              padding: "2px",
              background: "inherit",
              zIndex: -1,
            },
          }}
        >
          <Typography variant="h3" sx={{ color: "#C6DDF0", fontWeight: 800 }}>
            INVENTORY OVERVIEW
          </Typography>
        </Box>

        <InventoryStats inventory={inventory} />
        <Box sx={{ paddingX: 10, width: "100%", paddingBottom: 10 }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                variant="outlined"
                placeholder="Search by name"
                fullWidth
                sx={{ marginBottom: 2, borderColor: "#fff" }}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item>
              <Button
                onClick={handleAddProductOpen}
                variant="contained"
                sx={{
                  color: "#C6DDF0",
                  backgroundColor: "#5e4955",
                  "&:hover": {
                    backgroundColor: "#996888",
                  },
                }}
              >
                <AddIcon sx={{ color: "#C6DDF0" }} />
                Add New Item
              </Button>
            </Grid>
          </Grid>
          <InView triggerOnce>
            {({ inView, ref }) => (
              <TableContainer
                ref={ref}
                sx={{
                  width: "100%",
                  backgroundColor: "#2a2b2a",
                  backgroundImage:
                    "linear-gradient(169deg, #2a2b2a 0%, #51404a 30%, #51404a 56%, #9a6581 100%)"

                }}
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>No.</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Price($)</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Image</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredInventory.map((item, index) => (
                      <InView key={item.id} triggerOnce>
                        {({ inView, ref }) => (
                          <TableRow
                            ref={ref}
                            component={motion.tr}
                            initial="hidden"
                            animate={inView ? "visible" : "hidden"}
                            variants={tableRowVariants}
                            whileHover={{
                              scale: 1.01,
                              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
                            }}
                            transition={{ type: "spring", stiffness: 100 }}
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{item.name || "N/A"}</TableCell>
                            <TableCell>{item.category || "N/A"}</TableCell>
                            <TableCell>{item.price || "N/A"}</TableCell>
                            <TableCell>{item.quantity || "N/A"}</TableCell>
                            <TableCell>{item.unit || "N/A"}</TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => {
                                  setCurrentProduct(item);
                                  handleAddProductOpen();
                                }}
                              >
                                <Edit  sx={{color: "#C6DDF0"}}/>
                              </IconButton>
                              <IconButton onClick={() => removeItem(item.id)}>
                                <Delete sx={{color: "#C6DDF0"}} />
                              </IconButton>
                            </TableCell>
                            <TableCell>
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  style={{ width: "50px", height: "50px" }}
                                  onError={(e) =>
                                    (e.target.style.display = "none")
                                  }
                                />
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </InView>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </InView>
        </Box>
        <motion.div
          initial="hidden"
          animate={addProductOpen ? "visible" : "hidden"}
          variants={dialogVariants}
        >
          <Dialog
            open={addProductOpen}
            onClose={handleAddProductClose}
            PaperProps={{
              style: {
                backgroundColor: "#51404a",
                backgroundImage:
                    "linear-gradient(169deg, #2a2b2a 0%, #51404a 30%, #51404a 56%, #9a6581 100%)",
              },
            }}
          >
            <DialogTitle sx={{ color: "#fff" }}>
              {currentProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const { name, category, price, quantity, unit, imageUrl } =
                    e.target;
                  const product = {
                    name: name.value,
                    category: category.value,
                    price: parseFloat(price.value),
                    quantity: parseInt(quantity.value),
                    unit: unit.value,
                    imageUrl: imageUrl.value,
                  };

                  if (currentProduct) {
                    handleEditProduct({ ...product, id: currentProduct.id });
                  } else {
                    handleAddProduct(product);
                  }
                }}
              >
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  defaultValue={currentProduct?.name || ""}
                  variant="outlined"
                  sx={{ marginBottom: 2 }}
                  InputLabelProps={{ style: labelStyle }}
                  InputProps={{
                    style: { color: "#c6ddf0" },
                  }}
                />
                <TextField
                  select
                  fullWidth
                  name="category"
                  label="Category"
                  defaultValue={currentProduct?.category || ""}
                  variant="outlined"
                  sx={{ marginBottom: 2 }}
                  InputLabelProps={{ style: labelStyle }}
                  InputProps={{
                    style: { color: "#c6ddf0" },
                  }}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  name="price"
                  label="Price"
                  type="number"
                  defaultValue={currentProduct?.price || ""}
                  variant="outlined"
                  sx={{ marginBottom: 2 }}
                  InputLabelProps={{ style: labelStyle }}
                  InputProps={{
                    style: { color: "#c6ddf0" },
                  }}
                />
                <TextField
                  fullWidth
                  name="quantity"
                  label="Quantity"
                  type="number"
                  defaultValue={currentProduct?.quantity || ""}
                  variant="outlined"
                  sx={{ marginBottom: 2 }}
                  InputLabelProps={{ style: labelStyle }}
                  InputProps={{
                    style: { color: "#c6ddf0" },
                  }}
                />
                <TextField
                  select
                  fullWidth
                  name="unit"
                  label="Unit"
                  defaultValue={currentProduct?.unit || ""}
                  variant="outlined"
                  sx={{ marginBottom: 2 }}
                  InputLabelProps={{ style: labelStyle }}
                  InputProps={{
                    style: { color: "#c6ddf0" },
                  }}
                >
                  {units.map((unit) => (
                    <MenuItem key={unit} value={unit}>
                      {unit}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  name="imageUrl"
                  label="Image URL"
                  defaultValue={currentProduct?.imageUrl || ""}
                  variant="outlined"
                  sx={{ marginBottom: 2 }}
                  InputLabelProps={{ style: labelStyle }}
                  InputProps={{
                    style: { color: "#c6ddf0" },
                  }}
                />
                <DialogActions>
                  <Button
                    onClick={handleAddProductClose}
                    sx={{ color: "#c6ddf0" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      color: "#c6ddf0",
                      backgroundColor: "#5e4955",
                      "&:hover": {
                        backgroundColor: "#996888",
                      },
                    }}
                  >
                    {currentProduct ? "Save Changes" : "Add Product"}
                  </Button>
                </DialogActions>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </Box>
    </ThemeProvider>
  );
}
