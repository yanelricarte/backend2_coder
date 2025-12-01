const list = document.getElementById('orders');

fetch('http://localhost:8080/api/orders')
  .then(res => res.json())
  .then(data => {
    list.innerHTML = '';

    data.result.forEach(order => {
      const li = document.createElement('li');
      li.className = 'orders-item';

      const spanNumber = document.createElement('span');
      spanNumber.textContent = `#${order.number}`;

      const spanUser = document.createElement('span');
      // si no estás usando populate, se verá el id
      spanUser.textContent = order.user?.name || order.user || '-';

      const spanBusiness = document.createElement('span');
      spanBusiness.textContent = order.business?.name || order.business || '-';

      const spanTotal = document.createElement('span');
      spanTotal.className = 'total';
      spanTotal.textContent = `$${order.totalPrice}`;

      li.append(spanNumber, spanUser, spanBusiness, spanTotal);
      list.appendChild(li);
    });
  })
  .catch(err => {
    console.error('Error cargando órdenes:', err);
    list.innerHTML = '<li>Error al cargar las órdenes</li>';
  });
