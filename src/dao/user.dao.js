import { userModel } from '../models/user.model.js';

export default class UserDAO {
  async getUsers() {
    return await userModel.find();
  }

  async getUserById(id) {
    return await userModel.findById(id);
  }

  async createUser(userData) {
    return await userModel.create(userData);
  }
}
