import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export class PermissionService {
  static async requestAllPermissions() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Running in web, skipping native permissions');
      return;
    }

    try {
      // Request location permissions
      await this.requestLocationPermission();
      
      // Request camera permissions
      await this.requestCameraPermission();
      
      // Request microphone permissions (handled through camera plugin)
      console.log('Microphone permissions handled through camera plugin');
      
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  }

  static async requestLocationPermission() {
    try {
      const permissions = await Geolocation.requestPermissions();
      console.log('Location permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('Location permission error:', error);
      throw error;
    }
  }

  static async requestCameraPermission() {
    try {
      const permissions = await Camera.requestPermissions();
      console.log('Camera permissions:', permissions);
      return permissions;
    } catch (error) {
      console.error('Camera permission error:', error);
      throw error;
    }
  }

  static async checkLocationPermission() {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Check location permission error:', error);
      return false;
    }
  }

  static async getCurrentLocation() {
    try {
      const hasPermission = await this.checkLocationPermission();
      if (!hasPermission) {
        await this.requestLocationPermission();
      }
      
      const coordinates = await Geolocation.getCurrentPosition();
      return coordinates;
    } catch (error) {
      console.error('Get location error:', error);
      throw error;
    }
  }

  static async getDeviceInfo() {
    try {
      const info = await Device.getInfo();
      console.log('Device info:', info);
      return info;
    } catch (error) {
      console.error('Device info error:', error);
      return null;
    }
  }
}