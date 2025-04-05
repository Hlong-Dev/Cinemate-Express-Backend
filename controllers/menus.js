let menuSchema = require('../models/menu');

module.exports = {
    getAllMenus: async function() {
        // Lấy tất cả menu
        return await menuSchema.find({}).populate('parent');
    },
    
    getAllMenusHierarchical: async function() {
        // Lấy tất cả menu và sắp xếp theo cấu trúc cha-con
        const allMenus = await menuSchema.find({}).lean();
        
        // Tạo map để truy cập nhanh các menu theo ID
        const menuMap = {};
        allMenus.forEach(menu => {
            menu.children = [];
            menuMap[menu._id] = menu;
        });
        
        // Cây menu kết quả
        const rootMenus = [];
        
        // Tổ chức menu theo cấu trúc cha-con
        allMenus.forEach(menu => {
            if (menu.parent) {
                // Nếu có parent, thêm vào danh sách con của parent
                if (menuMap[menu.parent]) {
                    menuMap[menu.parent].children.push(menu);
                }
            } else {
                // Menu gốc không có parent
                rootMenus.push(menu);
            }
        });
        
        return rootMenus;
    },
    
    getMenuById: async function(id) {
        return await menuSchema.findById(id).populate('parent');
    },
    
    createMenu: async function(text, url, parent) {
        const menuData = {
            text: text,
            url: url
        };
        
        if (parent) {
            // Kiểm tra xem parent có tồn tại không
            const parentMenu = await menuSchema.findById(parent);
            if (parentMenu) {
                menuData.parent = parent;
            } else {
                throw new Error("Menu cha không tồn tại");
            }
        }
        
        const newMenu = new menuSchema(menuData);
        await newMenu.save();
        return newMenu;
    },
    
    updateMenu: async function(id, data) {
        // Kiểm tra trước khi cập nhật để tránh circular reference
        if (data.parent && data.parent === id) {
            throw new Error("Menu không thể là cha của chính nó");
        }
        
        if (data.parent) {
            // Kiểm tra parent có tồn tại không
            const parentMenu = await menuSchema.findById(data.parent);
            if (!parentMenu) {
                throw new Error("Menu cha không tồn tại");
            }
            
            // Kiểm tra tránh circular reference sâu hơn
            let currentParent = data.parent;
            while (currentParent) {
                const parent = await menuSchema.findById(currentParent);
                if (!parent) break;
                
                if (parent.parent && parent.parent.toString() === id) {
                    throw new Error("Không thể tạo vòng lặp trong cấu trúc menu");
                }
                currentParent = parent.parent;
            }
        }
        
        return await menuSchema.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );
    },
    
    deleteMenu: async function(id) {
        // Kiểm tra xem có menu con nào không
        const childMenus = await menuSchema.find({ parent: id });
        if (childMenus.length > 0) {
            throw new Error("Không thể xóa menu này vì có menu con đang phụ thuộc");
        }
        
        return await menuSchema.findByIdAndDelete(id);
    }
};