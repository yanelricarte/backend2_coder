// src/dao/business.dao.js
import { businessModel } from '../models/business.model.js';

class BusinessDAO {
  async getBusiness() {
    const business = await businessModel.find().lean();
    return business;
  }

  async createBusiness(data) {
    const created = await businessModel.create(data);
    return created.toObject();
  }

  async getBusinessById(id) {
    const business = await businessModel.findById(id).lean();
    return business;
  }

  async addProduct(businessId, productData) {
    const business = await businessModel.findById(businessId);
    if (!business) return null;

    business.products.push(productData);

    const updated = await business.save();
    return updated.toObject();
  }
}

//  Export nombrado 
export const businessDao = new BusinessDAO();
