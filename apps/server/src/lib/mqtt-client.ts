import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

// MQTT configuration from environment variables
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const MQTT_CLIENT_ID = `sector-platform-server-${Math.random().toString(16).substring(2, 8)}`;

// Topics
const TOPICS = {
  FIRMWARE_UPDATE: 'sector/firmware/updates',
};

class MqttClient {
  private client: mqtt.MqttClient | null = null;
  private isConnected = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      console.log(`Connecting to MQTT broker at ${MQTT_URL}...`);
      
      const options: mqtt.IClientOptions = {
        clientId: MQTT_CLIENT_ID,
        clean: true,
        reconnectPeriod: 5000,
      };

      // Add authentication if provided
      if (MQTT_USERNAME && MQTT_PASSWORD) {
        options.username = MQTT_USERNAME;
        options.password = MQTT_PASSWORD;
      }

      this.client = mqtt.connect(MQTT_URL, options);

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Connected to MQTT broker');
      });

      this.client.on('error', (error) => {
        console.error('MQTT connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
        this.isConnected = false;
      });
    } catch (error) {
      console.error('Failed to initialize MQTT client:', error);
    }
  }

  /**
   * Publish a message to the specified topic
   * @param topic The topic to publish to
   * @param message The message to publish (will be stringified if object)
   * @param options MQTT publish options
   * @returns Promise that resolves when the message is published
   */
  async publish(topic: string, message: any, options: mqtt.IClientPublishOptions = { qos: 1 }): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      console.warn('MQTT client not connected, message not sent');
      return false;
    }

    try {
      const payload = typeof message === 'object' ? JSON.stringify(message) : message;
      
      return new Promise((resolve, reject) => {
        this.client!.publish(topic, payload, options, (error) => {
          if (error) {
            console.error(`Error publishing to ${topic}:`, error);
            reject(error);
            return;
          }
          console.log(`Published message to ${topic}`);
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error publishing MQTT message:', error);
      return false;
    }
  }

  /**
   * Publish a firmware update event
   * @param firmwareBuild The firmware build data to publish
   * @returns Promise that resolves when the message is published
   */
  async publishFirmwareUpdate(firmwareBuild: any): Promise<boolean> {
    const topic = TOPICS.FIRMWARE_UPDATE;
    // Include only necessary information, avoiding sensitive data
    const message = {
      id: firmwareBuild.id,
      version: firmwareBuild.version,
      url: firmwareBuild.url,
      repositoryId: firmwareBuild.repositoryId,
      groupId: firmwareBuild.groupId,
      status: firmwareBuild.status,
      timestamp: new Date().toISOString(),
    };
    
    return this.publish(topic, message);
  }

  /**
   * Close the MQTT connection
   */
  close() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
    }
  }
}

// Create a singleton instance
export const mqttClient = new MqttClient();