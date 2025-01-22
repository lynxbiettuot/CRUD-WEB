const deleteProduct = (btn) => {
    //this btn attribute will return the button which you clicked
    //using btn.parentNode to query the parent node of this button
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article');

    //send data to server
    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
        .then(data => {
            return data.json();
        })
        .then(result => {
            console.log(result);
            productElement.parentNode.removeChild(productElement);
        })
        .catch(err => {
            console.log(err);
        });
}

