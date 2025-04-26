import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  updateDoc, 
  orderBy, 
  Timestamp,
  DocumentData,
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';

// =================== USER SERVICES ===================

// Fetch all users
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    return userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<User, 'id'>
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Fetch a single user by ID
export const fetchUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data() as Omit<User, 'id'>
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Update user roles
export const updateUserRoles = async (userId: string, roles: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      roles,
      lastUpdated: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating user roles:', error);
    throw error;
  }
};

// =================== USER REQUESTS SERVICES ===================

// Fetch all user requests
export const fetchUserRequests = async () => {
  try {
    const userRequestsCollection = collection(db, 'user_requests');
    const querySnapshot = await getDocs(userRequestsCollection);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user requests:', error);
    throw error;
  }
};

// Fetch user requests with a specific status
export const fetchUserRequestsByStatus = async (status: string) => {
  try {
    const userRequestsCollection = collection(db, 'user_requests');
    const q = query(userRequestsCollection, where('status', '==', status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user requests by status:', error);
    throw error;
  }
};

// Update a user request's status
export const updateUserRequestStatus = async (
  requestId: string, 
  status: string,
  roles?: string
) => {
  try {
    const requestRef = doc(db, 'user_requests', requestId);
    const updateData: DocumentData = { 
      status, 
      lastUpdated: Timestamp.now() 
    };
    
    if (roles) {
      updateData.roles = roles;
    }
    
    await updateDoc(requestRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating user request status:', error);
    throw error;
  }
};

// Approve a user request and create a new user in the users collection
export const approveUserRequest = async (
  requestId: string, 
  userId: string,
  roles: string
) => {
  try {
    // 1. Update the request status
    await updateUserRequestStatus(requestId, 'approved', roles);
    
    // 2. Create or update the user in the users collection
    const requestRef = doc(db, 'user_requests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (requestDoc.exists()) {
      const requestData = requestDoc.data();
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        name: requestData.name,
        email: requestData.email,
        phone: requestData.phone,
        roles: roles,
        status: 'approved',
        lastUpdated: Timestamp.now()
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error approving user request:', error);
    throw error;
  }
};

// Reject a user request
export const rejectUserRequest = async (requestId: string) => {
  try {
    await updateUserRequestStatus(requestId, 'rejected');
    return true;
  } catch (error) {
    console.error('Error rejecting user request:', error);
    throw error;
  }
};

// =================== OIL REPORTS SERVICES ===================

// Define the OilReport interface
export interface OilReport {
  id: string;
  barrelsCount: number;
  collectionTank: string;
  createdAt: Timestamp;
  cycleNumber: string;
  endTime: Timestamp;
  entryDate: Timestamp;
  flowStatus: string;
  notes: string;
  operationChosen: string;
  operatorName: string;
  quantitySource: string;
  startTime: Timestamp;
  tankSource: string;
  totalNetProduction: number;
  totalQuantityLiters: number;
  totals: number;
  userId: string;
  userName: string;
  waterOutputLiters: number;
}

// Fetch all oil reports
export const fetchOilReports = async (): Promise<OilReport[]> => {
  try {
    const reportsCollection = collection(db, 'oil_reports');
    const q = query(reportsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<OilReport, 'id'>
    })) as OilReport[];
  } catch (error) {
    console.error('Error fetching oil reports:', error);
    throw error;
  }
};

// Fetch a single oil report by ID
export const fetchOilReportById = async (reportId: string): Promise<OilReport | null> => {
  try {
    const reportDoc = await getDoc(doc(db, 'oil_reports', reportId));
    if (reportDoc.exists()) {
      return {
        id: reportDoc.id,
        ...reportDoc.data() as Omit<OilReport, 'id'>
      } as OilReport;
    }
    return null;
  } catch (error) {
    console.error('Error fetching oil report:', error);
    throw error;
  }
};

// Update an oil report
export const updateOilReport = async (reportId: string, data: Partial<OilReport>): Promise<boolean> => {
  try {
    const reportRef = doc(db, 'oil_reports', reportId);
    
    // Create a copy of data and remove fields that shouldn't be updated
    const updateData = { ...data };
    
    // Remove fields that shouldn't be updated (instead of setting to undefined)
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    
    await updateDoc(reportRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating oil report:', error);
    throw error;
  }
};

// Create a new oil report
export const createOilReport = async (data: Omit<Partial<OilReport>, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const reportsCollection = collection(db, 'oil_reports');
    
    // Add timestamps
    const reportData = {
      ...data,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(reportsCollection, reportData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating oil report:', error);
    throw error;
  }
};

// =================== WASTE REPORTS SERVICES ===================

// Define the WasteReport interface
export interface WasteReport {
  id: string;
  barrelsDelivered: number;
  createdAt: Timestamp;
  deliveryDocNumber: string;
  flowStatus: string;
  notes: string;
  quantityReceiptDate: Timestamp;
  receiverName: string;
  submissionDate: Timestamp;
  supplierName: string;
  supplyType: string;
  totalQuantityLiters: number;
  userId: string;
  userName: string;
}

// Fetch all waste reports
export const fetchWasteReports = async (): Promise<WasteReport[]> => {
  try {
    const reportsCollection = collection(db, 'waste_reports');
    const q = query(reportsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<WasteReport, 'id'>
    })) as WasteReport[];
  } catch (error) {
    console.error('Error fetching waste reports:', error);
    throw error;
  }
};

// Fetch a single waste report by ID
export const fetchWasteReportById = async (reportId: string): Promise<WasteReport | null> => {
  try {
    const reportDoc = await getDoc(doc(db, 'waste_reports', reportId));
    if (reportDoc.exists()) {
      return {
        id: reportDoc.id,
        ...reportDoc.data() as Omit<WasteReport, 'id'>
      } as WasteReport;
    }
    return null;
  } catch (error) {
    console.error('Error fetching waste report:', error);
    throw error;
  }
};

// Update a waste report
export const updateWasteReport = async (reportId: string, data: Partial<WasteReport>): Promise<boolean> => {
  try {
    const reportRef = doc(db, 'waste_reports', reportId);
    
    // Create a copy of data and remove fields that shouldn't be updated
    const updateData = { ...data };
    
    // Remove fields that shouldn't be updated (instead of setting to undefined)
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    
    await updateDoc(reportRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating waste report:', error);
    throw error;
  }
};

// Create a new waste report
export const createWasteReport = async (data: Omit<Partial<WasteReport>, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const reportsCollection = collection(db, 'waste_reports');
    
    // Add timestamps
    const reportData = {
      ...data,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(reportsCollection, reportData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating waste report:', error);
    throw error;
  }
};

// =================== DIESEL REPORTS SERVICES ===================

// Define the DieselReport interface
export interface DieselReport {
  id: string;
  barrelsCount: number;
  clientName: string;
  createdAt: Timestamp;
  cycleNumber: string;
  notes: string;
  quantityDispenseDate: Timestamp;
  receiptImageUrl: string;
  receiptNumber: string;
  shipmentExitTime: Timestamp;
  shipmentManager: string;
  submissionDate: Timestamp;
  totalQuantityLiters: number;
  userId: string;
  userName: string;
}

// Fetch all diesel reports
export const fetchDieselReports = async (): Promise<DieselReport[]> => {
  try {
    const reportsCollection = collection(db, 'dezil_reports');
    const q = query(reportsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<DieselReport, 'id'>
    })) as DieselReport[];
  } catch (error) {
    console.error('Error fetching diesel reports:', error);
    throw error;
  }
};

// Fetch a single diesel report by ID
export const fetchDieselReportById = async (reportId: string): Promise<DieselReport | null> => {
  try {
    const reportDoc = await getDoc(doc(db, 'dezil_reports', reportId));
    if (reportDoc.exists()) {
      return {
        id: reportDoc.id,
        ...reportDoc.data() as Omit<DieselReport, 'id'>
      } as DieselReport;
    }
    return null;
  } catch (error) {
    console.error('Error fetching diesel report:', error);
    throw error;
  }
};

// Update a diesel report
export const updateDieselReport = async (reportId: string, data: Partial<DieselReport>): Promise<boolean> => {
  try {
    const reportRef = doc(db, 'dezil_reports', reportId);
    
    // Create a copy of data and remove fields that shouldn't be updated
    const updateData = { ...data };
    
    // Remove fields that shouldn't be updated (instead of setting to undefined)
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;
    
    await updateDoc(reportRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating diesel report:', error);
    throw error;
  }
};

// Create a new diesel report
export const createDieselReport = async (data: Omit<Partial<DieselReport>, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const reportsCollection = collection(db, 'dezil_reports');
    
    // Add timestamps
    const reportData = {
      ...data,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(reportsCollection, reportData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating diesel report:', error);
    throw error;
  }
}; 