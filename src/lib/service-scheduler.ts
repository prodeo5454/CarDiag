export interface ServiceShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  website?: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  services: Array<{
    type: string;
    price: number;
    duration: number; // in minutes
  }>;
  hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  distance?: number; // in miles
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ServiceAppointment {
  id: string;
  vehicleId: string;
  shopId: string;
  serviceType: string;
  description: string;
  estimatedCost: number;
  estimatedDuration: number;
  scheduledDate: Date;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRequest {
  id: string;
  vehicleId: string;
  serviceType: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  preferredDate: Date;
  flexibleDates: boolean;
  budget?: number;
  location: string;
  zipCode: string;
  additionalNotes?: string;
  requestedShops: string[]; // Shop IDs
  status: 'pending' | 'searching' | 'quotes_received' | 'booked' | 'cancelled';
  quotes: Array<{
    shopId: string;
    shopName: string;
    price: number;
    estimatedDuration: number;
    availability: Date[];
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class ServiceScheduler {
  private static readonly STORAGE_KEY = 'cardiag-service-shops';
  private static readonly APPOINTMENTS_KEY = 'cardiag-service-appointments';
  private static readonly REQUESTS_KEY = 'cardiag-service-requests';

  // Shop Management
  static getShops(): ServiceShop[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : this.getDefaultShops();
    } catch (error) {
      console.error('Error loading shops:', error);
      return this.getDefaultShops();
    }
  }

  static saveShops(shops: ServiceShop[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(shops));
    } catch (error) {
      console.error('Error saving shops:', error);
    }
  }

  static addShop(shop: Omit<ServiceShop, 'id'>): ServiceShop {
    const shops = this.getShops();
    const newShop: ServiceShop = {
      ...shop,
      id: this.generateId(),
    };
    shops.push(newShop);
    this.saveShops(shops);
    return newShop;
  }

  static updateShop(id: string, updates: Partial<ServiceShop>): ServiceShop | null {
    const shops = this.getShops();
    const index = shops.findIndex(shop => shop.id === id);
    
    if (index === -1) return null;

    shops[index] = { ...shops[index], ...updates };
    this.saveShops(shops);
    return shops[index];
  }

  static deleteShop(id: string): boolean {
    const shops = this.getShops();
    const index = shops.findIndex(shop => shop.id === id);
    
    if (index === -1) return false;

    shops.splice(index, 1);
    this.saveShops(shops);
    return true;
  }

  // Shop Search
  static searchShops(query: {
    location?: string;
    zipCode?: string;
    serviceType?: string;
    radius?: number; // in miles
  }): ServiceShop[] {
    const shops = this.getShops();
    
    return shops.filter(shop => {
      // Location filter
      if (query.location && !shop.city.toLowerCase().includes(query.location.toLowerCase()) &&
          !shop.state.toLowerCase().includes(query.location.toLowerCase())) {
        return false;
      }

      // Zip code filter
      if (query.zipCode && shop.zipCode !== query.zipCode) {
        return false;
      }

      // Service type filter
      if (query.serviceType && !shop.specialties.includes(query.serviceType)) {
        return false;
      }

      // Radius filter (simplified - would need actual geolocation calculation)
      if (query.radius && shop.distance && shop.distance > query.radius) {
        return false;
      }

      return true;
    });
  }

  static getRecommendedShops(vehicleId: string, serviceType: string, limit: number = 5): ServiceShop[] {
    const shops = this.getShops();
    
    // Sort by rating and review count
    const sorted = shops
      .filter(shop => shop.specialties.includes(serviceType))
      .sort((a, b) => {
        // Weight rating more heavily than review count
        const aScore = a.rating * Math.log(a.reviewCount + 1);
        const bScore = b.rating * Math.log(b.reviewCount + 1);
        return bScore - aScore;
      });

    return sorted.slice(0, limit);
  }

  // Appointment Management
  static getAppointments(vehicleId?: string): ServiceAppointment[] {
    try {
      const data = localStorage.getItem(this.APPOINTMENTS_KEY);
      const appointments: ServiceAppointment[] = data ? JSON.parse(data) : [];
      
      return vehicleId 
        ? appointments.filter(apt => apt.vehicleId === vehicleId)
        : appointments;
    } catch (error) {
      console.error('Error loading appointments:', error);
      return [];
    }
  }

  static saveAppointment(appointment: Omit<ServiceAppointment, 'id' | 'createdAt' | 'updatedAt'>): ServiceAppointment {
    const appointments = this.getAppointments();
    const newAppointment: ServiceAppointment = {
      ...appointment,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    appointments.push(newAppointment);
    this.saveAppointments(appointments);
    return newAppointment;
  }

  static updateAppointment(id: string, updates: Partial<ServiceAppointment>): ServiceAppointment | null {
    const appointments = this.getAppointments();
    const index = appointments.findIndex(apt => apt.id === id);
    
    if (index === -1) return null;

    appointments[index] = { 
      ...appointments[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    this.saveAppointments(appointments);
    return appointments[index];
  }

  static cancelAppointment(id: string, reason?: string): boolean {
    const appointment = this.updateAppointment(id, { 
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
    });
    
    return !!appointment;
  }

  static getUpcomingAppointments(vehicleId?: string): ServiceAppointment[] {
    const now = new Date();
    const appointments = this.getAppointments(vehicleId);
    
    return appointments
      .filter(apt => 
        apt.scheduledDate > now && 
        ['scheduled', 'confirmed'].includes(apt.status)
      )
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }

  // Service Requests
  static getServiceRequests(vehicleId?: string): ServiceRequest[] {
    try {
      const data = localStorage.getItem(this.REQUESTS_KEY);
      const requests: ServiceRequest[] = data ? JSON.parse(data) : [];
      
      return vehicleId 
        ? requests.filter(req => req.vehicleId === vehicleId)
        : requests;
    } catch (error) {
      console.error('Error loading service requests:', error);
      return [];
    }
  }

  static saveServiceRequest(request: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): ServiceRequest {
    const requests = this.getServiceRequests();
    const newRequest: ServiceRequest = {
      ...request,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    requests.push(newRequest);
    this.saveServiceRequests(requests);
    return newRequest;
  }

  static updateServiceRequest(id: string, updates: Partial<ServiceRequest>): ServiceRequest | null {
    const requests = this.getServiceRequests();
    const index = requests.findIndex(req => req.id === id);
    
    if (index === -1) return null;

    requests[index] = { 
      ...requests[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    this.saveServiceRequests(requests);
    return requests[index];
  }

  // Automated Scheduling
  static scheduleService(
    vehicleId: string,
    serviceType: string,
    description: string,
    preferredDate: Date,
    options: {
      urgency?: 'low' | 'medium' | 'high' | 'urgent';
      budget?: number;
      location?: string;
      zipCode?: string;
      flexibleDates?: boolean;
    } = {}
  ): ServiceRequest {
    const request: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      vehicleId,
      serviceType,
      description,
      urgency: options.urgency || 'medium',
      preferredDate,
      flexibleDates: options.flexibleDates || false,
      budget: options.budget,
      location: options.location || '',
      zipCode: options.zipCode || '',
      requestedShops: [],
      status: 'pending',
      quotes: [],
    };

    return this.saveServiceRequest(request);
  }

  static findAvailableSlots(
    shopId: string,
    serviceType: string,
    preferredDate: Date,
    duration: number
  ): Date[] {
    const shop = this.getShops().find(s => s.id === shopId);
    if (!shop) return [];

    const service = shop.services.find(s => s.type === serviceType);
    if (!service) return [];

    // Generate available slots (simplified logic)
    const availableSlots: Date[] = [];
    const startDate = new Date(preferredDate);
    startDate.setHours(9, 0, 0, 0); // Start at 9 AM

    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      // Check if shop is open
      const dayOfWeek = currentDate.getDay();
      const hours = this.getHoursForDay(shop.hours, dayOfWeek);
      
      if (hours && hours !== 'Closed') {
        const [openTime, closeTime] = hours.split(' - ');
        const [openHour, openMin] = openTime.split(':').map(Number);
        const [closeHour, closeMin] = closeTime.split(':').map(Number);

        // Generate slots every 30 minutes
        for (let hour = openHour; hour < closeHour; hour++) {
          for (let min = 0; min < 60; min += 30) {
            if (hour === closeHour - 1 && min + duration > closeMin) break;
            
            const slotTime = new Date(currentDate);
            slotTime.setHours(hour, min, 0, 0);
            
            if (slotTime > new Date()) {
              availableSlots.push(slotTime);
            }
          }
        }
      }
    }

    return availableSlots;
  }

  // Reminders and Notifications
  static sendReminders(): number {
    const appointments = this.getAppointments();
    const now = new Date();
    let remindersSent = 0;

    appointments.forEach(appointment => {
      if (appointment.reminderSent) return;

      const timeUntilAppointment = appointment.scheduledDate.getTime() - now.getTime();
      const hoursUntil = timeUntilAppointment / (1000 * 60 * 60);

      // Send reminder 24 hours before
      if (hoursUntil <= 24 && hoursUntil > 23) {
        this.sendAppointmentReminder(appointment);
        this.updateAppointment(appointment.id, { reminderSent: true });
        remindersSent++;
      }
    });

    return remindersSent;
  }

  private static sendAppointmentReminder(appointment: ServiceAppointment): void {
    // In a real app, this would send an email/SMS/push notification
    console.log(`Reminder: Appointment scheduled for ${appointment.scheduledDate.toLocaleString()}`);
    
    // Store reminder notification
    const notifications = JSON.parse(localStorage.getItem('cardiag-notifications') || '[]');
    notifications.push({
      id: this.generateId(),
      type: 'appointment_reminder',
      title: 'Service Appointment Reminder',
      message: `Your ${appointment.serviceType} appointment is scheduled for ${appointment.scheduledDate.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      read: false,
    });
    localStorage.setItem('cardiag-notifications', JSON.stringify(notifications));
  }

  // Analytics
  static getServiceAnalytics(vehicleId?: string): {
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalSpent: number;
    averageCost: number;
    mostUsedShop: string;
    mostCommonService: string;
  } {
    const appointments = this.getAppointments(vehicleId);
    const now = new Date();

    const totalAppointments = appointments.length;
    const upcomingAppointments = appointments.filter(apt => 
      apt.scheduledDate > now && ['scheduled', 'confirmed'].includes(apt.status)
    ).length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;

    const totalSpent = appointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + apt.estimatedCost, 0);

    const averageCost = completedAppointments > 0 ? totalSpent / completedAppointments : 0;

    // Most used shop
    const shopCounts: Record<string, number> = {};
    appointments.forEach(apt => {
      shopCounts[apt.shopId] = (shopCounts[apt.shopId] || 0) + 1;
    });
    const mostUsedShopId = Object.entries(shopCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    const mostUsedShop = this.getShops().find(s => s.id === mostUsedShopId)?.name || 'None';

    // Most common service
    const serviceCounts: Record<string, number> = {};
    appointments.forEach(apt => {
      serviceCounts[apt.serviceType] = (serviceCounts[apt.serviceType] || 0) + 1;
    });
    const mostCommonService = Object.entries(serviceCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    return {
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalSpent,
      averageCost,
      mostUsedShop,
      mostCommonService,
    };
  }

  // Helper methods
  private static getDefaultShops(): ServiceShop[] {
    return [
      {
        id: 'shop-1',
        name: 'AutoCare Professional',
        address: '123 Main Street',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        phone: '(555) 123-4567',
        email: 'info@autocare.com',
        website: 'https://autocare.com',
        specialties: ['general', 'oil_change', 'brakes', 'engine'],
        rating: 4.5,
        reviewCount: 127,
        services: [
          { type: 'oil_change', price: 45, duration: 30 },
          { type: 'brakes', price: 250, duration: 120 },
          { type: 'engine', price: 500, duration: 180 },
        ],
        hours: {
          monday: '8:00 AM - 6:00 PM',
          tuesday: '8:00 AM - 6:00 PM',
          wednesday: '8:00 AM - 6:00 PM',
          thursday: '8:00 AM - 6:00 PM',
          friday: '8:00 AM - 6:00 PM',
          saturday: '9:00 AM - 4:00 PM',
          sunday: 'Closed',
        },
        distance: 2.5,
        coordinates: { lat: 37.7749, lng: -122.4194 },
      },
      {
        id: 'shop-2',
        name: 'Quick Lube Express',
        address: '456 Oak Avenue',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        phone: '(555) 987-6543',
        specialties: ['oil_change', 'general'],
        rating: 4.2,
        reviewCount: 89,
        services: [
          { type: 'oil_change', price: 35, duration: 20 },
          { type: 'general', price: 75, duration: 60 },
        ],
        hours: {
          monday: '7:00 AM - 7:00 PM',
          tuesday: '7:00 AM - 7:00 PM',
          wednesday: '7:00 AM - 7:00 PM',
          thursday: '7:00 AM - 7:00 PM',
          friday: '7:00 AM - 7:00 PM',
          saturday: '8:00 AM - 5:00 PM',
          sunday: '9:00 AM - 3:00 PM',
        },
        distance: 1.8,
        coordinates: { lat: 37.7849, lng: -122.4094 },
      },
    ];
  }

  private static saveAppointments(appointments: ServiceAppointment[]): void {
    try {
      localStorage.setItem(this.APPOINTMENTS_KEY, JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  }

  private static saveServiceRequests(requests: ServiceRequest[]): void {
    try {
      localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests));
    } catch (error) {
      console.error('Error saving service requests:', error);
    }
  }

  private static getHoursForDay(hours: any, dayOfWeek: number): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return hours[days[dayOfWeek]];
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
