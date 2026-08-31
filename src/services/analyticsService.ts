import { logAnalyticsEvent, logTryOnSessionToFirestore, db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface TryOnEventMetadata {
  productId: string;
  productName: string;
  sellerId?: string;
  userId?: string;
  selectedColor?: string;
  faceShapeDetected?: string;
  durationSeconds?: number;
  deviceInfo?: string;
}

/**
 * Record Try-On analytics events strictly storing metadata (never raw camera images).
 */
export const ARAnalytics = {
  tryOnStarted: async (metadata: TryOnEventMetadata) => {
    try {
      if (db) {
        await addDoc(collection(db, 'tryOnAnalytics'), {
          eventType: 'tryOnStarted',
          productId: metadata.productId,
          productName: metadata.productName,
          sellerId: metadata.sellerId || '',
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
      await logAnalyticsEvent({
        type: 'tryOn',
        productId: metadata.productId,
        productName: metadata.productName,
        userId: metadata.userId || 'anonymous',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('ARAnalytics.tryOnStarted error:', err);
    }
  },

  tryOnProductChanged: async (metadata: {
    previousProductId: string;
    newProductId: string;
    newProductName: string;
    userId?: string;
  }) => {
    try {
      if (db) {
        await addDoc(collection(db, 'tryOnAnalytics'), {
          eventType: 'tryOnProductChanged',
          previousProductId: metadata.previousProductId,
          newProductId: metadata.newProductId,
          newProductName: metadata.newProductName,
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('ARAnalytics.tryOnProductChanged error:', err);
    }
  },

  tryOnCaptured: async (metadata: TryOnEventMetadata) => {
    try {
      if (db) {
        await addDoc(collection(db, 'tryOnAnalytics'), {
          eventType: 'tryOnCaptured',
          productId: metadata.productId,
          productName: metadata.productName,
          selectedColor: metadata.selectedColor || '',
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('ARAnalytics.tryOnCaptured error:', err);
    }
  },

  tryOnAddedToCart: async (metadata: TryOnEventMetadata) => {
    try {
      if (db) {
        await addDoc(collection(db, 'tryOnAnalytics'), {
          eventType: 'tryOnAddedToCart',
          productId: metadata.productId,
          productName: metadata.productName,
          selectedColor: metadata.selectedColor || '',
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
      await logAnalyticsEvent({
        type: 'addToCart',
        productId: metadata.productId,
        productName: metadata.productName,
        userId: metadata.userId || 'anonymous',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('ARAnalytics.tryOnAddedToCart error:', err);
    }
  },

  tryOnEnded: async (metadata: TryOnEventMetadata) => {
    try {
      if (db) {
        await addDoc(collection(db, 'tryOnAnalytics'), {
          eventType: 'tryOnEnded',
          productId: metadata.productId,
          productName: metadata.productName,
          durationSeconds: metadata.durationSeconds || 0,
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
      await logTryOnSessionToFirestore({
        productId: metadata.productId,
        productName: metadata.productName,
        sellerId: metadata.sellerId,
        userId: metadata.userId,
        durationSeconds: metadata.durationSeconds,
        faceShapeDetected: metadata.faceShapeDetected,
      });
    } catch (err) {
      console.warn('ARAnalytics.tryOnEnded error:', err);
    }
  },

  // -----------------------------------------------------------------
  // AR PRODUCT DISPLAY (Real-Size Physical Marker Showcase Telemetry)
  // -----------------------------------------------------------------
  arDisplayOpened: async (metadata: {
    productId: string;
    productName: string;
    sellerId?: string;
    userId?: string;
  }) => {
    try {
      if (db) {
        await addDoc(collection(db, 'arDisplayAnalytics'), {
          eventType: 'arDisplayOpened',
          productId: metadata.productId,
          productName: metadata.productName,
          sellerId: metadata.sellerId || '',
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
      await logAnalyticsEvent({
        type: 'view',
        productId: metadata.productId,
        productName: metadata.productName,
        userId: metadata.userId || 'anonymous',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('ARAnalytics.arDisplayOpened error:', err);
    }
  },

  arTargetDetected: async (metadata: {
    productId: string;
    productName: string;
    targetDimensionMm?: number;
    userId?: string;
  }) => {
    try {
      if (db) {
        await addDoc(collection(db, 'arDisplayAnalytics'), {
          eventType: 'arTargetDetected',
          productId: metadata.productId,
          productName: metadata.productName,
          targetDimensionMm: metadata.targetDimensionMm || 100,
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('ARAnalytics.arTargetDetected error:', err);
    }
  },

  arDimensionViewed: async (metadata: {
    productId: string;
    productName: string;
    frameWidthMm?: number;
    userId?: string;
  }) => {
    try {
      if (db) {
        await addDoc(collection(db, 'arDisplayAnalytics'), {
          eventType: 'arDimensionViewed',
          productId: metadata.productId,
          productName: metadata.productName,
          frameWidthMm: metadata.frameWidthMm || 138,
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('ARAnalytics.arDimensionViewed error:', err);
    }
  },

  arFaceTryOnStartedFromDisplay: async (metadata: {
    productId: string;
    productName: string;
    userId?: string;
  }) => {
    try {
      if (db) {
        await addDoc(collection(db, 'arDisplayAnalytics'), {
          eventType: 'arFaceTryOnStartedFromDisplay',
          productId: metadata.productId,
          productName: metadata.productName,
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('ARAnalytics.arFaceTryOnStartedFromDisplay error:', err);
    }
  },

  arDisplayAddedToCart: async (metadata: {
    productId: string;
    productName: string;
    selectedColor?: string;
    price?: number;
    userId?: string;
  }) => {
    try {
      if (db) {
        await addDoc(collection(db, 'arDisplayAnalytics'), {
          eventType: 'arDisplayAddedToCart',
          productId: metadata.productId,
          productName: metadata.productName,
          selectedColor: metadata.selectedColor || '',
          price: metadata.price || 0,
          userId: metadata.userId || 'anonymous',
          timestamp: new Date().toISOString(),
        });
      }
      await logAnalyticsEvent({
        type: 'addToCart',
        productId: metadata.productId,
        productName: metadata.productName,
        userId: metadata.userId || 'anonymous',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('ARAnalytics.arDisplayAddedToCart error:', err);
    }
  },
};
